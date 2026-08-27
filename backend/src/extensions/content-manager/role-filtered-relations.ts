import type { Core } from '@strapi/strapi';

type AdminContext = {
  params: { model?: string; targetField?: string };
  request: { query?: Record<string, unknown> };
  query?: Record<string, unknown>;
  body?: unknown;
};

const REQUIRED_ROLE: Record<string, string> = {
  'api::course.course:instructor': 'instructor',
  'api::enrollment.enrollment:student': 'student',
};

const ids = (value: unknown): number[] => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map(Number).filter(Number.isInteger);
};

/**
 * Strapi's stock relation picker queries the whole target content type. Both of
 * our fields target Users, so decorate only those two picker requests with the
 * role constraint their source field implies. This relies on the Content
 * Manager controller contract in the pinned Strapi 5.52.1 dependency.
 */
export function registerRoleFilteredRelations(strapi: Core.Strapi): void {
  const controller = strapi.plugin('content-manager').controller('relations') as {
    findAvailable(ctx: AdminContext): Promise<unknown>;
    extractAndValidateRequestInfo(ctx: AdminContext, id?: unknown): Promise<unknown>;
  };
  const original = controller.findAvailable.bind(controller);

  controller.findAvailable = async (ctx: AdminContext) => {
    const key = `${ctx.params.model}:${ctx.params.targetField}`;
    const requiredRole = REQUIRED_ROLE[key];
    if (!requiredRole) return original(ctx);

    const query = (ctx.request.query ?? ctx.query ?? {}) as Record<string, unknown>;
    // Retain Strapi's model, field, entry and admin-RBAC validation.
    await controller.extractAndValidateRequestInfo(ctx, query.id);

    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 10)));
    const search = typeof query._q === 'string' ? query._q.trim() : '';
    const excluded = [...new Set([...ids(query.idsToOmit), ...ids(query.idsToInclude)])];
    const where: Record<string, unknown> = { role: { type: requiredRole } };
    if (search) where.username = { $containsi: search };
    if (excluded.length > 0) where.id = { $notIn: excluded };

    const [results, total] = await strapi.db
      .query('plugin::users-permissions.user')
      .findWithCount({
        where,
        select: ['id', 'documentId', 'username', 'updatedAt', 'publishedAt'],
        orderBy: { username: 'asc' },
        offset: (page - 1) * pageSize,
        limit: pageSize,
      });

    ctx.body = {
      results,
      pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total },
    };
    return ctx.body;
  };
}
