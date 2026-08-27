import { factories } from '@strapi/strapi';
import type { ApiContext } from '../../../utils/context';
import { hasPlatformContentAccess, roleOf } from '../../../utils/auth';
import { ROLES } from '../../../constants/roles';
import { stripProtectedFields } from '../../../utils/request';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  /**
   * A student may only list lessons of a course they are enrolled in, so the
   * request must name a course and we verify enrollment before answering.
   */
  async find(ctx: ApiContext) {
    const user = ctx.state.user!;
    const role = roleOf(user);

    if (!hasPlatformContentAccess(user)) {
      const filters = (ctx.query.filters ?? {}) as { course?: { documentId?: string } };
      const courseId = filters.course?.documentId;
      if (!courseId) return ctx.badRequest('A course filter is required');

      if (role === ROLES.STUDENT) {
        const [enrollment] = await strapi.documents('api::enrollment.enrollment').findMany({
          filters: { student: { id: user.id }, course: { documentId: courseId } },
          fields: ['documentId'],
          limit: 1,
        });
        if (!enrollment) return ctx.forbidden('You are not enrolled in this course');
      } else if (role === ROLES.INSTRUCTOR) {
        const course = await strapi.documents('api::course.course').findOne({
          documentId: courseId,
          populate: { instructor: { fields: ['id'] } },
        });
        const instructor = course?.instructor as { id?: number } | undefined;
        if (instructor?.id !== user.id) return ctx.forbidden('Not your course');
      } else {
        return ctx.forbidden('Not permitted');
      }
    }

    // Sequence is the point of a lesson list.
    ctx.query = { ...ctx.query, sort: ctx.query.sort ?? 'order:asc' };
    return super.find(ctx);
  },

  async create(ctx: ApiContext) {
    stripProtectedFields(ctx, ['progresses']);
    return super.create(ctx);
  },

  async update(ctx: ApiContext) {
    // The owning course is fixed at creation; moving a lesson between courses
    // would sidestep the ownership check made when it was created.
    stripProtectedFields(ctx, ['course', 'progresses']);
    return super.update(ctx);
  },

  /** A deleted lesson must not leave completion rows behind. */
  async delete(ctx: ApiContext) {
    const [progresses, learningSessions] = await Promise.all([
      strapi.documents('api::lesson-progress.lesson-progress').findMany({
        filters: { lesson: { documentId: ctx.params.id } },
        fields: ['documentId'],
        limit: -1,
      }),
      strapi.documents('api::learning-session.learning-session').findMany({
        filters: { lesson: { documentId: ctx.params.id } },
        fields: ['documentId'],
        limit: -1,
      }),
    ]);
    const response = await super.delete(ctx);
    await Promise.all(progresses.map((row) =>
      strapi.documents('api::lesson-progress.lesson-progress').delete({
        documentId: row.documentId,
      })
    ));
    await Promise.all(learningSessions.map((row) =>
      strapi.documents('api::learning-session.learning-session').delete({
        documentId: row.documentId,
      })
    ));
    return response;
  },

  /** POST /lessons/:id/complete — idempotent. */
  async complete(ctx: ApiContext) {
    const user = ctx.state.user!;
    const result = await strapi.service('api::lesson.lesson').markComplete(ctx.params.id, user.id);
    if (!result) return ctx.notFound('Lesson not found');
    return { data: result };
  },

  /** DELETE /lessons/:id/complete */
  async uncomplete(ctx: ApiContext) {
    const user = ctx.state.user!;
    const result = await strapi.service('api::lesson.lesson').markIncomplete(ctx.params.id, user.id);
    if (!result) return ctx.notFound('Lesson not found');
    return { data: result };
  },
}));
