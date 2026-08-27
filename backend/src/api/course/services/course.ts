import { factories } from '@strapi/strapi';
import { calculateProgress } from '../../../utils/progress';

export type CourseProgress = {
  completed: number;
  total: number;
  percent: number;
  completedLessonIds: string[];
};

export default factories.createCoreService('api::course.course', ({ strapi }) => ({
  /**
   * Progress for one student in one course.
   *
   * Two counts, not a join walk — lesson-progress carries a denormalised course
   * relation precisely so this stays cheap.
   */
  async getProgressFor(courseDocumentId: string, userId: number): Promise<CourseProgress> {
    const lessons = await strapi.documents('api::lesson.lesson').findMany({
      filters: { course: { documentId: courseDocumentId } },
      fields: ['documentId'],
      limit: -1,
    });

    const progress = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
      filters: { student: { id: userId }, course: { documentId: courseDocumentId } },
      populate: { lesson: { fields: ['documentId'] } },
      limit: -1,
    });

    return calculateProgress(
      lessons.map((lesson) => lesson.documentId),
      progress.map((row) => (row.lesson as { documentId?: string } | undefined)?.documentId)
    );
  },

  /** Keep the denormalised enrollment status aligned with actual progress. */
  async syncEnrollmentStatus(courseDocumentId: string, userId: number, value?: CourseProgress) {
    const [enrollment] = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { student: { id: userId }, course: { documentId: courseDocumentId } },
      fields: ['documentId', 'status'],
      limit: 1,
    });
    if (!enrollment) return;

    const progress = value ?? await this.getProgressFor(courseDocumentId, userId);
    const status = progress.total > 0 && progress.completed === progress.total
      ? 'completed'
      : 'active';
    if (enrollment.status !== status) {
      await strapi.documents('api::enrollment.enrollment').update({
        documentId: enrollment.documentId,
        data: { status },
      });
    }
  },
}));
