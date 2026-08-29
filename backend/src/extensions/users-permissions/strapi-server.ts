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

const INSTRUCTOR_REQUEST_UID = 'api::instructor-request.instructor-request' as const;

export default (plugin: Plugin) => {
  // Plugin content types must be extended programmatically: a partial schema.json
  // would replace, rather than safely merge with, the users-permissions schema.
  plugin.contentTypes.user.schema.attributes.bio = { type: 'text', maxLength: 280 };
  plugin.contentTypes.user.schema.attributes.avatarUrl = { type: 'string', maxLength: 500 };
  plugin.contentTypes.user.schema.attributes.instructorApprovalPending = { type: 'boolean', default: false };
  plugin.contentTypes.user.schema.info.mainField = 'username';

  // Plugin controllers are factories. Reading `.register` directly from the
  // factory returns undefined and was why the custom signup path could not run.
  const authControllerFactory = plugin.controllers.auth as unknown as (args: { strapi: Core.Strapi }) => {
    register: (ctx: ApiContext) => Promise<unknown>;
  };
  const extensionStrapi = (global as unknown as { strapi: Core.Strapi }).strapi;
  const originalRegister = authControllerFactory({ strapi: extensionStrapi }).register;

  /**
   * Sign-up accepts a role, but only Student or Instructor.
   *
   * Without this, `{"role":"admin"}` in a registration payload would be a
   * one-request privilege escalation. Admin and Content Manager are assigned by
   * an existing admin instead.
   */
  const registerWithRole = async (ctx: ApiContext) => {
    const queryRole = typeof ctx.query.role === 'string' ? ctx.query.role : undefined;
    const requested = (queryRole ?? ROLES.STUDENT) as RoleType;

    if (!SELF_ASSIGNABLE_ROLES.includes(requested)) {
      return ctx.badRequest(
        'You may register as a student or an instructor. Other roles are assigned by an administrator.'
      );
    }

    // The role travels in the query string because Strapi validates the request
    // body with a strict schema before this controller runs. The body therefore
    // contains only fields supported by the stock registration endpoint.
    await originalRegister(ctx);

    const created = (ctx.body ?? {}) as { user?: { id?: number } };
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const registeredEmail = typeof ctx.request.body === 'object' && ctx.request.body
      ? String((ctx.request.body as Record<string, unknown>).email ?? '').trim().toLowerCase()
      : '';
    const fallbackUser = !created.user?.id && registeredEmail
      ? await strapi.query('plugin::users-permissions.user').findOne({ where: { email: registeredEmail } })
      : null;
    const createdUserId = created.user?.id ?? fallbackUser?.id;
    if (createdUserId) {
      const role = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: requested } });
      if (role) {
        // Use the plugin service for relations. A low-level query update leaves
        // the user attached to Strapi's default Authenticated role in v5.
        await strapi
          .plugin('users-permissions')
          .service('user')
          .edit(createdUserId, { role: role.id });
        if (created.user) (created.user as Record<string, unknown>).role = { id: role.id, type: role.type, name: role.name };
        if (requested === ROLES.INSTRUCTOR) {
          // The users-permissions service reliably updates role relations, but
          // sanitises plugin-extension fields such as this pending flag. Persist
          // approval state explicitly after the role write so the admin queue
          // cannot lose a successfully registered instructor.
          await strapi.query('plugin::users-permissions.user').update({
            where: { id: createdUserId },
            data: { blocked: true, instructorApprovalPending: true },
          });
          const registeredUser = await strapi.query('plugin::users-permissions.user').findOne({
            where: { id: createdUserId },
            select: ['id', 'username', 'email'],
          });
          if (!registeredUser) throw new Error('Registered instructor account could not be loaded');

          // Keep approval requests in their own table. Deriving the queue from
          // user fields made requests disappear whenever a plugin service
          // sanitised or rewrote those fields during role assignment.
          await strapi.db.query(INSTRUCTOR_REQUEST_UID).create({
            data: {
              userId: registeredUser.id,
              username: registeredUser.username,
              email: registeredUser.email,
              approvalStatus: 'pending',
            },
          });
          if (created.user) {
            (created.user as Record<string, unknown>).blocked = true;
            (created.user as Record<string, unknown>).instructorApprovalPending = true;
          }
        } else {
          await strapi.query('plugin::users-permissions.user').update({
            where: { id: createdUserId },
            data: { instructorApprovalPending: false },
          });
        }
      }
    }
    return ctx.body;
  };

  // Strapi resolves the stock registration route before plugin extensions are
  // applied, so replacing `auth.register` alone does not reliably replace its
  // already-bound handler. Give the application an explicit route/controller
  // pair and have the frontend call that endpoint.
  plugin.controllers.user.registerWithRole = registerWithRole;

  plugin.controllers.user.instructorRequests = async (_ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const requests = await strapi.db.query(INSTRUCTOR_REQUEST_UID).findMany({
      where: { approvalStatus: 'pending' },
      select: ['userId', 'username', 'email', 'createdAt'],
      orderBy: { createdAt: 'asc' },
    });
    const data = [];
    for (const { userId, username, email, createdAt } of requests) {
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { role: true },
      });
      if (user?.role?.type === ROLES.INSTRUCTOR) data.push({ id: userId, username, email, createdAt });
    }
    return { data };
  };

  plugin.controllers.user.approveInstructor = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id < 1) return ctx.badRequest('Invalid instructor request');
    const request = await strapi.db.query(INSTRUCTOR_REQUEST_UID).findOne({ where: { userId: id } });
    if (!request) return ctx.notFound('Instructor request not found');
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { id }, populate: { role: true } });
    if (!user || user.role?.type !== ROLES.INSTRUCTOR) return ctx.notFound('Instructor request not found');
    if (request.approvalStatus === 'approved') {
      return { data: { id: user.id, username: user.username, blocked: user.blocked } };
    }
    if (request.approvalStatus !== 'pending') return ctx.badRequest('Instructor request has already been rejected');
    const updated = await strapi.query('plugin::users-permissions.user').update({
      where: { id },
      data: { blocked: false, instructorApprovalPending: false },
    });
    await strapi.db.query(INSTRUCTOR_REQUEST_UID).update({
      where: { id: request.id },
      data: { approvalStatus: 'approved', reviewedAt: new Date().toISOString() },
    });
    return { data: { id: updated.id, username: updated.username, blocked: updated.blocked } };
  };

  plugin.controllers.user.rejectInstructor = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id < 1) return ctx.badRequest('Invalid instructor request');
    const request = await strapi.db.query(INSTRUCTOR_REQUEST_UID).findOne({ where: { userId: id } });
    if (!request) return ctx.notFound('Instructor request not found');
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { id }, populate: { role: true } });
    if (!user || user.role?.type !== ROLES.INSTRUCTOR) return ctx.notFound('Instructor request not found');
    if (request.approvalStatus === 'rejected') {
      return { data: { id: user.id, username: user.username, blocked: user.blocked } };
    }
    if (request.approvalStatus !== 'pending') return ctx.badRequest('Instructor request has already been approved');
    const updated = await strapi.query('plugin::users-permissions.user').update({
      where: { id },
      data: { blocked: true, instructorApprovalPending: false },
    });
    await strapi.db.query(INSTRUCTOR_REQUEST_UID).update({
      where: { id: request.id },
      data: { approvalStatus: 'rejected', reviewedAt: new Date().toISOString() },
    });
    return { data: { id: updated.id, username: updated.username, blocked: updated.blocked } };
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

  /** Public instructor profiles. Never expose email, role metadata, or account state. */
  plugin.controllers.user.publicInstructors = async (_ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const users = await strapi.query('plugin::users-permissions.user').findMany({
      where: { role: { type: ROLES.INSTRUCTOR }, blocked: false, confirmed: true },
      select: ['id', 'username', 'bio', 'avatarUrl'],
      orderBy: { username: 'asc' },
    });

    return {
      data: (users as Array<Record<string, unknown>>).map((user) => ({
        id: user.id,
        username: user.username,
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
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
  plugin.controllers.user.stats = async (ctx: ApiContext) => {
    const strapi = (global as unknown as { strapi: Core.Strapi }).strapi;
    const includeDetails = ctx.query.details === 'true';

    const roles = await strapi.query('plugin::users-permissions.role').findMany({});
    const appRoles = (roles as Array<{ id: number; type: string }>).filter((role) =>
      Object.values(ROLES).includes(role.type as RoleType)
    );
    const roleCounts = await Promise.all(
      appRoles.map((role) =>
        strapi.query('plugin::users-permissions.user').count({ where: { role: role.id } })
      )
    );
    const usersByRole: Record<string, number> = {};
    for (const [index, role] of appRoles.entries()) {
      usersByRole[role.type] = roleCounts[index];
    }

    const [totalUsers, totalCourses, totalLessons, totalEnrollments, publishedPosts, allPosts, courseDetails] =
      await Promise.all([
        strapi.query('plugin::users-permissions.user').count(),
        strapi.query('api::course.course').count(),
        strapi.query('api::lesson.lesson').count(),
        strapi.query('api::enrollment.enrollment').count(),
        strapi.documents('api::post.post').count({ status: 'published' }),
        strapi.documents('api::post.post').count({ status: 'draft' }),
        includeDetails
          ? strapi.documents('api::course.course').findMany({
              fields: ['documentId', 'title'],
              populate: {
                lessons: {
                  fields: ['documentId', 'title', 'order', 'contentType', 'durationMinutes'],
                  sort: ['order:asc'],
                },
                enrollments: {
                  fields: ['documentId'],
                  populate: { student: { fields: ['id', 'username', 'email'] } },
                },
              },
              sort: ['title:asc'],
              limit: -1,
            })
          : Promise.resolve([]),
      ]);

    return {
      data: {
        usersByRole,
        totalUsers,
        totalCourses,
        totalLessons,
        totalEnrollments,
        totalPosts: allPosts,
        publishedPosts,
        draftPosts: Math.max(0, allPosts - publishedPosts),
        courseDetails,
      },
    };
  };

  plugin.routes['content-api'].routes.push(
    { method: 'POST', path: '/register-with-role', handler: 'user.registerWithRole', config: { prefix: '', auth: false } },
    { method: 'GET', path: '/instructor-requests', handler: 'user.instructorRequests', config: { prefix: '', policies: ['global::is-authenticated', 'global::is-admin'] } },
    { method: 'PUT', path: '/instructor-requests/:id/approve', handler: 'user.approveInstructor', config: { prefix: '', policies: ['global::is-authenticated', 'global::is-admin'] } },
    { method: 'PUT', path: '/instructor-requests/:id/reject', handler: 'user.rejectInstructor', config: { prefix: '', policies: ['global::is-authenticated', 'global::is-admin'] } },
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
      method: 'GET',
      path: '/instructor-profiles',
      handler: 'user.publicInstructors',
      config: { prefix: '', auth: false },
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
