import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { bodyData } from '../../../utils/request';
import { comboDiscountFor, DEFAULT_COMBO_TIERS, normalizeComboTiers } from '../../../utils/combo-discount';
import { ROLES } from '../../../constants/roles';
const finalPrice = (p: number, d: number) => Math.round(p * (1 - Math.min(100, Math.max(0, d)) / 100) * 100) / 100;
export default factories.createCoreController('api::enrollment-application.enrollment-application', ({ strapi }) => ({
  async submit(ctx: ApiContext) {
    const input = bodyData(ctx); const user = ctx.state.user!;
    const ids = Array.isArray(input.courseIds) ? [...new Set(input.courseIds.filter((v): v is string => typeof v === 'string'))] : [];
    if (!ids.length) return ctx.badRequest('Select at least one course');
    for (const key of ['name','email','phone','discord','institution','paymentMethod','paymentProofUrl']) if (typeof input[key] !== 'string' || !(input[key] as string).trim()) return ctx.badRequest(`${key} is required`);
    const phone = String(input.phone).trim();
    if (!/^\d{11}$/.test(phone)) return ctx.badRequest('Mobile number must contain exactly 11 digits');
    let proofPath = '';
    try { proofPath = new URL(input.paymentProofUrl as string).pathname; }
    catch { return ctx.badRequest('Payment proof must be an uploaded image'); }
    const proof = await strapi.db.query('plugin::upload.file').findOne({ where: { url: proofPath } });
    if (!proof || !String(proof.mime ?? '').startsWith('image/') || Number(proof.size ?? 0) > 5120) {
      return ctx.badRequest('Payment proof must be an uploaded image of 5 MB or smaller');
    }
    if (!['bkash','rocket','nagad'].includes(input.paymentMethod as string)) return ctx.badRequest('Invalid payment method');
    const courses = await strapi.documents('api::course.course').findMany({ filters: { documentId: { $in: ids }, isPublished: true }, fields: ['documentId','title','price','discountPercent'], limit: -1 });
    if (courses.length !== ids.length) return ctx.badRequest('A selected course is unavailable');
    const summary = courses.map(c => ({ documentId: c.documentId, title: String(c.title ?? 'Course'), amount: finalPrice(Number(c.price), Number(c.discountPercent ?? 0)) }));
    const subtotal = summary.reduce((sum, c) => sum + c.amount, 0);
    const [[offer], priorEnrollments] = await Promise.all([
      strapi.documents('api::combo-offer.combo-offer').findMany({ fields: ['tiers','loyaltyDiscount','isActive'], limit: 1, sort: 'updatedAt:desc' }),
      strapi.documents('api::enrollment.enrollment').findMany({ filters: { student: { id: user.id } }, fields: ['documentId'], limit: 1 }),
    ]);
    const tiers = offer ? normalizeComboTiers(offer.tiers) : DEFAULT_COMBO_TIERS;
    const comboDiscount = offer?.isActive === false ? 0 : Math.min(subtotal, comboDiscountFor(ids.length, tiers));
    const configuredLoyaltyDiscount = offer ? Number(offer.loyaltyDiscount ?? 300) : 300;
    const loyaltyDiscount = offer?.isActive === false || priorEnrollments.length === 0 ? 0 : Math.min(subtotal - comboDiscount, configuredLoyaltyDiscount);
    const totalAmount = Math.max(0, subtotal - comboDiscount - loyaltyDiscount);
    const created = await strapi.documents('api::enrollment-application.enrollment-application').create({ data: { student: user.id, courseIds: ids, courseSummary: summary, name: (input.name as string).trim(), email: (input.email as string).trim(), phone, discord: String(input.discord ?? '').trim(), institution: String(input.institution ?? '').trim(), paymentMethod: input.paymentMethod as 'bkash'|'rocket'|'nagad', paymentProofUrl: (input.paymentProofUrl as string).trim(), comboDiscount, loyaltyDiscount, totalAmount, status: 'pending' } });
    try {
      const contentManagers = await strapi.query('plugin::users-permissions.user').findMany({
        where: { role: { type: ROLES.CONTENT_MANAGER }, blocked: false },
        select: ['id'],
      }) as Array<{ id: number }>;
      const courseNames = summary.map((course) => course.title).join(', ');
      const notifications = await Promise.allSettled(
        contentManagers.map((manager) =>
          strapi.documents('api::notification.notification').create({
            data: {
              recipient: manager.id,
              type: 'enrollment_request',
              title: 'New enrollment request',
              message: `${String(input.name).trim()}: ${courseNames}`.slice(0, 240),
              href: '/enrollment-requests',
            },
          })
        )
      );
      const failures = notifications.filter((result) => result.status === 'rejected').length;
      if (failures > 0) strapi.log.error(`Could not create ${failures} enrollment request notifications`);
    } catch (error) {
      strapi.log.error('Could not notify Content Managers about an enrollment request', error);
    }
    return { data: { documentId: created.documentId, status: created.status, comboDiscount, loyaltyDiscount, totalAmount } };
  },
  async queue() { return { data: await strapi.documents('api::enrollment-application.enrollment-application').findMany({ populate: { student: { fields: ['id','username','email'] } }, sort: 'createdAt:desc', limit: -1 }) }; },
  async mine(ctx: ApiContext) {
    const rows = await strapi.documents('api::enrollment-application.enrollment-application').findMany({
      filters: { student: { id: ctx.state.user!.id } },
      fields: ['documentId', 'courseSummary', 'status', 'createdAt', 'reviewedAt'],
      sort: 'createdAt:desc',
      limit: 50,
    });
    return { data: rows };
  },
  async review(ctx: ApiContext) {
    const decision = bodyData(ctx).decision;
    if (!['approved','rejected'].includes(decision as string)) return ctx.badRequest('Invalid decision');
    const app = await strapi.documents('api::enrollment-application.enrollment-application').findOne({ documentId: ctx.params.id, populate: { student: { fields: ['id'] } } });
    if (!app) return ctx.notFound('Application not found'); if (app.status !== 'pending') return ctx.badRequest('Already reviewed');
    const studentId = (app.student as {id:number}).id;
    if (decision === 'approved') { for (const courseId of app.courseIds as string[]) { const [row] = await strapi.documents('api::enrollment.enrollment').findMany({ filters: { student: { id: studentId }, course: { documentId: courseId } }, limit: 1 }); if (!row) await strapi.documents('api::enrollment.enrollment').create({ data: { student: studentId, course: courseId, enrolledAt: new Date(), status: 'active' } }); } }
    const updated = await strapi.documents('api::enrollment-application.enrollment-application').update({ documentId: ctx.params.id, data: { status: decision as 'approved'|'rejected', reviewedAt: new Date() } });
    const courseNames = (app.courseSummary as Array<{ title?: string }>).map((course) => course.title).filter(Boolean).join(', ');
    try {
      await strapi.documents('api::notification.notification').create({
        data: {
          recipient: studentId,
          type: decision === 'approved' ? 'payment_approved' : 'payment_rejected',
          title: decision === 'approved' ? 'Payment accepted' : 'Payment rejected',
          message: courseNames || 'Your enrollment application was reviewed.',
          href: decision === 'approved' ? '/my-courses' : '/enroll',
        },
      });
    } catch (error) {
      strapi.log.error('Could not create enrollment notification', error);
    }
    return { data: updated };
  }
}));
