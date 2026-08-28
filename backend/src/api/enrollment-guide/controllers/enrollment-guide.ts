import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { bodyData } from '../../../utils/request';
import {
  DEFAULT_ENROLLMENT_GUIDE,
  normalizeEnrollmentGuide,
} from '../../../utils/enrollment-guide';

const requiredTextFields = [
  'guidelinesTitle',
  'guidelinesSummary',
  'guidelinesDescription',
  'supportPhone',
  'enrollmentTitle',
  'enrollmentSummary',
  'enrollmentDescription',
  'paymentTitle',
  'paymentSummary',
  'paymentDescription',
] as const;

export default factories.createCoreController('api::enrollment-guide.enrollment-guide', ({ strapi }) => ({
  async current() {
    const [row] = await strapi.documents('api::enrollment-guide.enrollment-guide').findMany({
      limit: 1,
      sort: 'updatedAt:desc',
    });
    return { data: normalizeEnrollmentGuide(row) };
  },

  async save(ctx: ApiContext) {
    const [row] = await strapi.documents('api::enrollment-guide.enrollment-guide').findMany({ limit: 1 });
    const current = row ? normalizeEnrollmentGuide(row) : DEFAULT_ENROLLMENT_GUIDE;
    const data = normalizeEnrollmentGuide(bodyData(ctx), current);

    if (requiredTextFields.some((field) => !data[field])) {
      return ctx.badRequest('Complete every enrollment content field');
    }
    if (!data.guidelines.length) return ctx.badRequest('Add at least one enrollment guideline');
    if (!data.enrollmentSteps.length) return ctx.badRequest('Add at least one enrollment step');
    if (!data.paymentMethods.length) return ctx.badRequest('Add at least one payment method');

    if (data.videoUrl) {
      try {
        const url = new URL(data.videoUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
        data.videoUrl = url.toString();
      } catch {
        return ctx.badRequest('Enter a valid HTTP or HTTPS video URL');
      }
    }

    const saved = row
      ? await strapi.documents('api::enrollment-guide.enrollment-guide').update({
          documentId: row.documentId,
          data,
        })
      : await strapi.documents('api::enrollment-guide.enrollment-guide').create({ data });

    return { data: normalizeEnrollmentGuide(saved) };
  },
}));
