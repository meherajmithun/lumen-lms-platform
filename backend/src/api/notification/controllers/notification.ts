import { factories, type Core } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { ROLES } from '../../../constants/roles';

type CurrentUser = { id: number; role?: { type?: string } };

async function syncPendingRequestNotifications(strapi: Core.Strapi, user: CurrentUser) {
  if (user.role?.type === ROLES.CONTENT_MANAGER) {
    const [applications, existing] = await Promise.all([
      strapi.documents('api::enrollment-application.enrollment-application').findMany({
        filters: { status: 'pending' },
        fields: ['documentId', 'name', 'courseSummary'],
        sort: 'createdAt:desc',
        limit: 100,
      }),
      strapi.documents('api::notification.notification').findMany({
        filters: { recipient: { id: user.id }, type: 'enrollment_request' },
        fields: ['sourceKey'],
        limit: 200,
      }),
    ]);
    const known = new Set(existing.map((row) => row.sourceKey).filter(Boolean));
    await Promise.allSettled(applications.filter((row) => !known.has(`enrollment:${row.documentId}`)).map((row) => {
      const courses = (row.courseSummary as Array<{ title?: string }> | null)?.map((course) => course.title).filter(Boolean).join(', ') ?? '';
      return strapi.documents('api::notification.notification').create({ data: {
        recipient: user.id,
        type: 'enrollment_request',
        title: 'New enrollment request',
        message: `${String(row.name ?? 'Student')}: ${courses || 'Enrollment application'}`.slice(0, 240),
        href: '/enrollment-requests',
        sourceKey: `enrollment:${row.documentId}`,
      } });
    }));
  }

  if (user.role?.type === ROLES.ADMIN) {
    const [requests, existing] = await Promise.all([
      strapi.db.query('api::instructor-request.instructor-request').findMany({
        where: { approvalStatus: 'pending' },
        select: ['userId', 'username', 'email'],
        limit: 100,
      }) as Promise<Array<{ userId: number; username: string; email: string }>>,
      strapi.documents('api::notification.notification').findMany({
        filters: { recipient: { id: user.id }, type: 'instructor_request' },
        fields: ['sourceKey'],
        limit: 200,
      }),
    ]);
    const known = new Set(existing.map((row) => row.sourceKey).filter(Boolean));
    await Promise.allSettled(requests.filter((row) => !known.has(`instructor:${row.userId}`)).map((row) =>
      strapi.documents('api::notification.notification').create({ data: {
        recipient: user.id,
        type: 'instructor_request',
        title: 'New instructor request',
        message: `${row.username} (${row.email})`.slice(0, 240),
        href: '/admin/instructor-requests',
        sourceKey: `instructor:${row.userId}`,
      } })
    ));
  }
}

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  async mine(ctx: ApiContext) {
    const current = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: ctx.state.user!.id },
      select: ['id'],
      populate: { role: true },
    }) as CurrentUser | null;
    if (current) await syncPendingRequestNotifications(strapi, current);
    const rows = await strapi.documents('api::notification.notification').findMany({
      filters: { recipient: { id: ctx.state.user!.id } },
      fields: ['documentId', 'type', 'title', 'message', 'href', 'sourceKey', 'readAt', 'createdAt'],
      sort: 'createdAt:desc',
      limit: 50,
    });
    const requestEvent = (row: typeof rows[number]) => `${row.type}:${row.message}:${row.href}`;
    const keyedRequestEvents = new Set(
      rows.filter((row) => row.sourceKey && (row.type === 'enrollment_request' || row.type === 'instructor_request')).map(requestEvent)
    );
    const seenSourceKeys = new Set<string>();
    const seenLegacyEvents = new Set<string>();
    const data = rows.filter((row) => {
      if (row.type !== 'enrollment_request' && row.type !== 'instructor_request') return true;
      const event = requestEvent(row);
      if (row.sourceKey) {
        if (seenSourceKeys.has(row.sourceKey)) return false;
        seenSourceKeys.add(row.sourceKey);
        return true;
      }
      if (keyedRequestEvents.has(event) || seenLegacyEvents.has(event)) return false;
      seenLegacyEvents.add(event);
      return true;
    });
    return { data };
  },

  async readAll(ctx: ApiContext) {
    const rows = await strapi.documents('api::notification.notification').findMany({
      filters: { recipient: { id: ctx.state.user!.id }, readAt: { $null: true } },
      fields: ['documentId'],
      limit: 100,
    });
    const readAt = new Date();
    await Promise.all(
      rows.map((row) =>
        strapi.documents('api::notification.notification').update({
          documentId: row.documentId,
          data: { readAt },
        })
      )
    );
    return { data: { updated: rows.length, readAt } };
  },
}));
