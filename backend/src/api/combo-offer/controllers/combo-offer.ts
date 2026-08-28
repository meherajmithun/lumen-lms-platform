import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { bodyData } from '../../../utils/request';
import { DEFAULT_COMBO_TIERS, normalizeComboTiers } from '../../../utils/combo-discount';

const defaults = {
  title: 'Combo Offer',
  description: 'Enroll in multiple courses and save more with each eligible combo.',
  tiers: DEFAULT_COMBO_TIERS,
  loyaltyDiscount: 300,
  isActive: true,
};

export default factories.createCoreController('api::combo-offer.combo-offer', ({ strapi }) => ({
  async current() {
    const [row] = await strapi.documents('api::combo-offer.combo-offer').findMany({ limit: 1, sort: 'updatedAt:desc' });
    if (!row) return { data: defaults };
    return { data: { title: row.title, description: row.description, tiers: normalizeComboTiers(row.tiers), loyaltyDiscount: Number(row.loyaltyDiscount ?? 300), isActive: row.isActive } };
  },
  async save(ctx: ApiContext) {
    const input = bodyData(ctx);
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const tiers = normalizeComboTiers(input.tiers);
    if (!title || !description) return ctx.badRequest('Title and description are required');
    if (!tiers.length) return ctx.badRequest('Add at least one valid discount tier for 2 or more courses');
    const loyaltyDiscount = Number(input.loyaltyDiscount);
    if (!Number.isFinite(loyaltyDiscount) || loyaltyDiscount < 0) return ctx.badRequest('Loyalty discount must be zero or more');
    const data = { title, description, tiers, loyaltyDiscount: Math.round(loyaltyDiscount * 100) / 100, isActive: input.isActive !== false };
    const [row] = await strapi.documents('api::combo-offer.combo-offer').findMany({ limit: 1 });
    if (row) await strapi.documents('api::combo-offer.combo-offer').update({ documentId: row.documentId, data });
    else await strapi.documents('api::combo-offer.combo-offer').create({ data });
    return { data };
  },
}));
