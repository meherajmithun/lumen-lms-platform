import type { Core } from '@strapi/strapi';
import { ROLES, SELF_ASSIGNABLE_ROLES, type RoleType } from '../../constants/roles';
import type { ApiContext } from '../../utils/context';

/**
 * Extends the users-permissions plugin with:
 *   - a registration override that refuses privileged roles
 *   - admin-only user listing and role management
 *   - admin-only platform statistics
 */

type Plugin = {
  controllers: Record<string, Record<string, unknown>>;
  routes: { 'content-api': { routes: unknown[] } };
  contentTypes: {
    user: {
      schema: {
        info: Record<string, unknown>;
        attributes: Record<string, unknown>;
      };
    };
  };
};

export default (plugin: Plugin) => {
  // Plugin content types must be extended programmatically: a partial schema.json
  // would replace, rather than safely merge with, the users-permissions schema.
  plugin.contentTypes.user.schema.attributes.bio = { type: 'text', maxLength: 280 };
  plugin.contentTypes.user.schema.attributes.avatarUrl = { type: 'string', maxLength: 500 };
  plugin.contentTypes.user.schema.info.mainField = 'username';

  const originalRegister = plugin.controllers.auth.register as (ctx: ApiContext) => Promise<unknown>;

  /**
   * Sign-up accepts a role, but only Student or Instructor.
   *
   * Without this, `{"role":"admin"}` in a registration payload would be a
   * one-request privilege escalation. Admin and Content Manager are assigned by
   * an existing admin instead.
   */
  plugin.controllers.auth.register = async (ctx: ApiContext) => {
    const body = (ctx.request.body ?? {}) as Record<string, unknown>;
    const requested = typeof body.role === 'string' ? (body.role as RoleType) : ROLES.STUDENT;

    if (!SELF_ASSIGNABLE_ROLES.includes(requested)) {
      return ctx.badRequest(
        'You may register as a student or an instructor. Other roles are assigned by an administrator.'
      );
    }

    // Strapi validates the registration payload with a strict schema. Replacing
    // the request body is intentional: mutating the object returned by Koa is
    // not sufficient in every Strapi 5 request-body implementation, and leaves
    // `role` visible to the stock validator as an invalid parameter.
    const registrationBody = { ...body };
    delete registrationBody.role;
    ctx.request.body = registrationBody;
    await originalRegister(ctx);

    const created = (ctx.body ?? {}) as { user?: { id?: number } };
    if (created.user?.id) {
      const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
      const role = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: requested } });
      if (role) {
        await strapi
          .query('plugin::users-permissions.user')
          .update({ where: { id: created.user.id }, data: { role: role.id } });
        (created.user as Record<string, unknown>).role = { id: role.id, type: role.type, name: role.name };
      }
    }
    return ctx.body;
  };

  /**
   * GET /users/me — the signed-in user, with their role.
   *
   * The stock controller drops `role` even with ?populate=role, because Strapi's
   * content-API sanitiser strips relations pointing at content types the caller
   * cannot read, and no application role has read permission on the role type
   * itself. Without this override every caller looks like a Student to the
   * frontend. Read server-side and shaped explicitly, like every other place we
   * need a relation the sanitiser would remove.
   */
  plugin.controllers.user.me = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const current = ctx.state.user;
    if (!current) return ctx.unauthorized('Not authenticated');

    const user = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: current.id }, populate: { role: true } });
    if (!user) return ctx.notFound('User not found');

    const role = user.role as { id: number; type: string; name: string } | undefined;

    ctx.body = {
      id: user.id,
      username: user.username,
      email: user.email,
      confirmed: user.confirmed,
      blocked: user.blocked,
      createdAt: user.createdAt,
      bio: user.bio ?? '',
      avatarUrl: user.avatarUrl ?? '',
      role: role ? { id: role.id, type: role.type, name: role.name } : null,
    };
    return ctx.body;
  };

  /** PUT /users/me/profile — self-service, non-security profile fields only. */
  plugin.controllers.user.updateProfile = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const current = ctx.state.user;
    if (!current) return ctx.unauthorized('Not authenticated');

    const body = (ctx.request.body ?? {}) as Record<string, unknown>;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : '';

    if (username.length < 2 || username.length > 60) {
      return ctx.badRequest('Your name must be between 2 and 60 characters.');
    }
    if (bio.length > 280) return ctx.badRequest('Your bio must be 280 characters or fewer.');
    if (avatarUrl.length > 500) return ctx.badRequest('Your profile image URL is too long.');
    if (avatarUrl) {
      try {
        const url = new URL(avatarUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
      } catch {
        return ctx.badRequest('Enter a valid http or https profile image URL.');
      }
    }

    const updated = await strapi.query('plugin::users-permissions.user').update({
      where: { id: current.id },
      data: { username, bio, avatarUrl },
    });

    return { data: { id: updated.id, username: updated.username, bio: updated.bio ?? '', avatarUrl: updated.avatarUrl ?? '' } };
  };

  /** Minimal Instructor directory for course assignment controls. */
  plugin.controllers.user.instructors = async (_ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const users = await strapi.query('plugin::users-permissions.user').findMany({
      where: { role: { type: ROLES.INSTRUCTOR }, blocked: false },
      select: ['id', 'documentId', 'username', 'email'],
      orderBy: { username: 'asc' },
    });
    return {
      data: (users as Array<Record<string, unknown>>).map((user) => ({
        id: user.id,
        documentId: user.documentId,
        username: user.username,
        email: user.email,
      })),
    };
  };

  /** GET /users — admin only, paginated, with role attached. */
  plugin.controllers.user.find = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const page = Math.max(1, Number(ctx.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(ctx.query.pageSize ?? 25)));
    const search = typeof ctx.query.search === 'string' ? ctx.query.search.trim() : '';

    const where = search
      ? { $or: [{ username: { $containsi: search } }, { email: { $containsi: search } }] }
      : {};

    const [users, total] = await Promise.all([
      strapi.query('plugin::users-permissions.user').findMany({
        where,
        populate: { role: true },
        orderBy: { createdAt: 'desc' },
        offset: (page - 1) * pageSize,
        limit: pageSize,
      }),
      strapi.query('plugin::users-permissions.user').count({ where }),
    ]);

    return {
      data: (users as Array<Record<string, unknown>>).map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        confirmed: u.confirmed,
        blocked: u.blocked,
        createdAt: u.createdAt,
        role: u.role,
      })),
      meta: { pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } },
    };
  };

  /**
   * PUT /users/:id/role — the admin panel's role management.
   *
   * Two guards that matter more than they look:
   *   - you cannot change your own role (no accidental self-demotion)
   *   - you cannot remove the last admin (no locking everyone out of the platform)
   */
  plugin.controllers.user.updateRole = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const actor = ctx.state.user!;
    const targetId = Number(ctx.params.id);
    const body = (ctx.request.body ?? {}) as { role?: string };
    const nextRole = body.role as RoleType | undefined;

    if (!nextRole) return ctx.badRequest('A role is required');
    if (!Object.values(ROLES).includes(nextRole)) return ctx.badRequest('Unknown role');
    if (targetId === actor.id) return ctx.badRequest('You cannot change your own role');

    const target = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: targetId }, populate: { role: true } });
    if (!target) return ctx.notFound('User not found');

    const currentType = (target.role as { type?: string } | undefined)?.type;
    if (currentType === ROLES.ADMIN && nextRole !== ROLES.ADMIN) {
      const adminRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: ROLES.ADMIN } });
      const adminCount = await strapi
        .query('plugin::users-permissions.user')
        .count({ where: { role: adminRole?.id } });
      if (adminCount <= 1) {
        return ctx.badRequest('This is the last admin — promote someone else first');
      }
    }

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: nextRole } });
    if (!role) return ctx.badRequest('Role not configured');

    const updated = await strapi
      .query('plugin::users-permissions.user')
      .update({ where: { id: targetId }, data: { role: role.id }, populate: { role: true } });

    return {
      data: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
      },
    };
  };

  /** GET /users/stats — platform statistics for the admin dashboard. */
  plugin.controllers.user.stats = async (_ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;

    const roles = await strapi.query('plugin::users-permissions.role').findMany({});
    const usersByRole: Record<string, number> = {};
    for (const role of roles as Array<{ id: number; type: string }>) {
      if (!Object.values(ROLES).includes(role.type as RoleType)) continue;
      usersByRole[role.type] = await strapi
        .query('plugin::users-permissions.user')
        .count({ where: { role: role.id } });
    }

    const [totalUsers, totalCourses, totalLessons, totalEnrollments, totalQuizzes, totalAttempts] =
      await Promise.all([
        strapi.query('plugin::users-permissions.user').count(),
        strapi.query('api::course.course').count(),
        strapi.query('api::lesson.lesson').count(),
        strapi.query('api::enrollment.enrollment').count(),
        strapi.query('api::quiz.quiz').count(),
        strapi.query('api::quiz-attempt.quiz-attempt').count(),
      ]);

    const publishedPosts = await strapi.documents('api::post.post').count({ status: 'published' });
    const allPosts = await strapi.documents('api::post.post').count({ status: 'draft' });

    return {
      data: {
        usersByRole,
        totalUsers,
        totalCourses,
        totalLessons,
        totalEnrollments,
        totalQuizzes,
        totalQuizAttempts: totalAttempts,
        totalPosts: allPosts,
        publishedPosts,
        draftPosts: Math.max(0, allPosts - publishedPosts),
      },
    };
  };

  plugin.routes['content-api'].routes.push(
    {
      method: 'PUT',
      path: '/users/me/profile',
      handler: 'user.updateProfile',
      config: { prefix: '', policies: ['global::is-authenticated'] },
    },
    {
      method: 'GET',
      path: '/instructors',
      handler: 'user.instructors',
      config: {
        prefix: '',
        policies: [
          'global::is-authenticated',
          { name: 'global::has-role', config: { roles: ['admin', 'content_manager', 'instructor'] } },
        ],
      },
    },
    {
      method: 'PUT',
      path: '/users/:id/role',
      handler: 'user.updateRole',
      config: { prefix: '', policies: ['global::is-authenticated', 'global::is-admin'] },
    },
    {
      // Deliberately not /users/stats — the core GET /users/:id route is
      // registered first and would capture it with id="stats".
      method: 'GET',
      path: '/platform-stats',
      handler: 'user.stats',
      config: { prefix: '', policies: ['global::is-authenticated', 'global::is-admin'] },
    }
  );

  return plugin;
};
