import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  async mine(ctx: ApiContext) {
    const rows = await strapi.documents('api::notification.notification').findMany({
      filters: { recipient: { id: ctx.state.user!.id } },
      fields: ['documentId', 'type', 'title', 'message', 'href', 'readAt', 'createdAt'],
      sort: 'createdAt:desc',
      limit: 50,
    });
    return { data: rows };
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
