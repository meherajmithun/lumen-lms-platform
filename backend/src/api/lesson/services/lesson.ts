import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::lesson.lesson', ({ strapi }) => ({
  /**
   * Marks a lesson complete for a student.
   *
   * Idempotent by design: clicking "complete" twice must leave exactly one row
   * and an unchanged percentage. We look for an existing row first rather than
   * relying on a unique constraint, because Strapi's schema DSL has no composite
   * unique index — the lifecycle hook is the second line of defence.
   */
  async markComplete(lessonDocumentId: string, userId: number) {
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: lessonDocumentId,
      populate: { course: { fields: ['documentId'] } },
    });
    if (!lesson) return null;

    const course = lesson.course as { documentId?: string } | undefined;
    if (!course?.documentId) return null;

    const [existing] = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
      filters: { student: { id: userId }, lesson: { documentId: lessonDocumentId } },
      fields: ['documentId'],
      limit: 1,
    });

    if (!existing) {
      await strapi.documents('api::lesson-progress.lesson-progress').create({
        data: {
          student: userId,
          lesson: lessonDocumentId,
          course: course.documentId,
          completedAt: new Date(),
        },
      });
    }

    const progress = await strapi
      .service('api::course.course')
      .getProgressFor(course.documentId, userId);

    await strapi.service('api::course.course')
      .syncEnrollmentStatus(course.documentId, userId, progress);

    return { courseId: course.documentId, alreadyComplete: Boolean(existing), progress };
  },

  async markIncomplete(lessonDocumentId: string, userId: number) {
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: lessonDocumentId,
      populate: { course: { fields: ['documentId'] } },
    });
    const course = lesson?.course as { documentId?: string } | undefined;
    if (!course?.documentId) return null;

    const [existing] = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
      filters: { student: { id: userId }, lesson: { documentId: lessonDocumentId } },
      fields: ['documentId'],
      limit: 1,
    });
    if (existing) {
      await strapi
        .documents('api::lesson-progress.lesson-progress')
        .delete({ documentId: existing.documentId });
    }

    const progress = await strapi
      .service('api::course.course')
      .getProgressFor(course.documentId, userId);
    await strapi.service('api::course.course')
      .syncEnrollmentStatus(course.documentId, userId, progress);

    return { courseId: course.documentId, progress };
  },
}));
