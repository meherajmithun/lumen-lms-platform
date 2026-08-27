import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { bodyData } from '../../../utils/request';
const finalPrice = (p: number, d: number) => Math.round(p * (1 - Math.min(100, Math.max(0, d)) / 100) * 100) / 100;
export default factories.createCoreController('api::enrollment-application.enrollment-application', ({ strapi }) => ({
  async submit(ctx: ApiContext) {
    const input = bodyData(ctx); const user = ctx.state.user!;
    const ids = Array.isArray(input.courseIds) ? [...new Set(input.courseIds.filter((v): v is string => typeof v === 'string'))] : [];
    if (!ids.length) return ctx.badRequest('Select at least one course');
    for (const key of ['name','email','phone','discord','institution','paymentMethod','transactionId']) if (typeof input[key] !== 'string' || !(input[key] as string).trim()) return ctx.badRequest(`${key} is required`);
    if (!['bkash','rocket','nagad'].includes(input.paymentMethod as string)) return ctx.badRequest('Invalid payment method');
    const courses = await strapi.documents('api::course.course').findMany({ filters: { documentId: { $in: ids }, isPublished: true }, fields: ['documentId','title','price','discountPercent'], limit: -1 });
    if (courses.length !== ids.length) return ctx.badRequest('A selected course is unavailable');
    const summary = courses.map(c => ({ documentId: c.documentId, title: String(c.title ?? 'Course'), amount: finalPrice(Number(c.price), Number(c.discountPercent ?? 0)) }));
    const totalAmount = summary.reduce((sum, c) => sum + c.amount, 0);
    const created = await strapi.documents('api::enrollment-application.enrollment-application').create({ data: { student: user.id, courseIds: ids, courseSummary: summary, name: (input.name as string).trim(), email: (input.email as string).trim(), phone: (input.phone as string).trim(), discord: String(input.discord ?? '').trim(), institution: String(input.institution ?? '').trim(), paymentMethod: input.paymentMethod as 'bkash'|'rocket'|'nagad', transactionId: (input.transactionId as string).trim(), totalAmount, status: 'pending' } });
    return { data: { documentId: created.documentId, status: created.status, totalAmount } };
  },
  async queue() { return { data: await strapi.documents('api::enrollment-application.enrollment-application').findMany({ populate: { student: { fields: ['id','username','email'] } }, sort: 'createdAt:desc', limit: -1 }) }; },
  async review(ctx: ApiContext) {
    const decision = bodyData(ctx).decision;
    if (!['approved','rejected'].includes(decision as string)) return ctx.badRequest('Invalid decision');
    const app = await strapi.documents('api::enrollment-application.enrollment-application').findOne({ documentId: ctx.params.id, populate: { student: { fields: ['id'] } } });
    if (!app) return ctx.notFound('Application not found'); if (app.status !== 'pending') return ctx.badRequest('Already reviewed');
    if (decision === 'approved') { const studentId = (app.student as {id:number}).id; for (const courseId of app.courseIds as string[]) { const [row] = await strapi.documents('api::enrollment.enrollment').findMany({ filters: { student: { id: studentId }, course: { documentId: courseId } }, limit: 1 }); if (!row) await strapi.documents('api::enrollment.enrollment').create({ data: { student: studentId, course: courseId, enrolledAt: new Date(), status: 'active' } }); } }
    return { data: await strapi.documents('api::enrollment-application.enrollment-application').update({ documentId: ctx.params.id, data: { status: decision as 'approved'|'rejected', reviewedAt: new Date() } }) };
  }
}));
