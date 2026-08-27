import { errors } from '@strapi/utils';
import { resolveRelationId } from '../../../../utils/relation';

const { ValidationError } = errors;

/**
 * One completion row per student per lesson.
 *
 * The complete endpoint is a find-or-create so it never duplicates, but nothing
 * stops a second row being written from the admin panel — and a duplicate would
 * make a course read as more than 100% complete.
 */
export default {
  async beforeCreate(event: { params: { data?: Record<string, unknown> } }) {
    const data = event.params.data;
    if (!data) return;

    const strapi = (global as unknown as { strapi: Parameters<typeof resolveRelationId>[0] }).strapi;

    const studentId = await resolveRelationId(
      strapi, data.student, 'plugin::users-permissions.user'
    );
    const lessonId = await resolveRelationId(strapi, data.lesson, 'api::lesson.lesson');
    const courseId = await resolveRelationId(strapi, data.course, 'api::course.course');
    if (studentId == null || lessonId == null || courseId == null) {
      throw new ValidationError('Lesson progress needs a student, lesson and course.');
    }

    const lesson = await strapi.query('api::lesson.lesson').findOne({
      where: { id: lessonId },
      populate: { course: { select: ['id'] } },
    });
    const lessonCourseId = (lesson?.course as { id?: number } | undefined)?.id;
    if (lessonCourseId !== courseId) {
      throw new ValidationError('That lesson does not belong to the selected course.');
    }

    const existing = await strapi.query('api::lesson-progress.lesson-progress').count({
      where: { student: studentId, lesson: lessonId },
    });
    if (existing > 0) {
      throw new ValidationError('That lesson is already marked complete for this student.');
    }
  },
};
