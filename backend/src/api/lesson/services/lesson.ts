import { factories } from '@strapi/strapi';
import { lessonDurationSeconds, utcDate } from '../../../utils/learning-time';

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
      fields: ['documentId', 'completedAt'],
      limit: 1,
    });

    let progressRow = existing;
    if (!existing) {
      progressRow = await strapi.documents('api::lesson-progress.lesson-progress').create({
        data: {
          student: userId,
          lesson: lessonDocumentId,
          course: course.documentId,
          completedAt: new Date(),
        },
      });
    }

    const durationSeconds = lessonDurationSeconds(lesson.durationMinutes);
    const completionSessionKey = `completion:${progressRow!.documentId}`;
    const [durationCredit] = await strapi.documents('api::learning-session.learning-session').findMany({
      filters: { student: { id: userId }, sessionKey: completionSessionKey },
      fields: ['documentId'],
      limit: 1,
    });
    if (!durationCredit && durationSeconds > 0) {
      const completedAt = new Date(progressRow!.completedAt ?? Date.now());
      await strapi.documents('api::learning-session.learning-session').create({
        data: {
          student: userId,
          course: course.documentId,
          lesson: lessonDocumentId,
          sessionKey: completionSessionKey,
          activityDate: utcDate(completedAt),
          activeSeconds: durationSeconds,
          lastSequence: 0,
          lastHeartbeatAt: completedAt,
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
      const durationCredits = await strapi.documents('api::learning-session.learning-session').findMany({
        filters: { student: { id: userId }, sessionKey: `completion:${existing.documentId}` },
        fields: ['documentId'],
        limit: -1,
      });
      await Promise.all(durationCredits.map((row) =>
        strapi.documents('api::learning-session.learning-session').delete({ documentId: row.documentId })
      ));
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
