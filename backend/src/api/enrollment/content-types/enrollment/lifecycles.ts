import { errors } from '@strapi/utils';
import { ROLES } from '../../../../constants/roles';
import { resolveRelationId, resolveUserId, roleTypeOf } from '../../../../utils/relation';

const { ValidationError } = errors;

/**
 * Only students enroll, and only once per course.
 *
 * The enrollment controller already refuses both, but that only covers the app's
 * own endpoint. This is the last line: it holds for the admin panel too, where
 * the relation picker would otherwise happily enroll an Admin twice.
 */
export default {
  async beforeCreate(event: { params: { data?: Record<string, unknown> } }) {
    const data = event.params.data;
    if (!data) return;

    const strapi = (global as unknown as { strapi: Parameters<typeof resolveUserId>[0] }).strapi;

    const studentId = await resolveUserId(strapi, data.student);
    if (studentId == null) throw new ValidationError('An enrollment needs a student.');

    const role = await roleTypeOf(strapi, studentId);
    if (role !== ROLES.STUDENT) {
      throw new ValidationError(
        `Only students can enroll in a course. That user is ${
          role ? `a ${role.replace('_', ' ')}` : 'not assigned a role'
        }.`
      );
    }

    const courseId = await resolveRelationId(strapi, data.course, 'api::course.course');
    if (courseId == null) throw new ValidationError('An enrollment needs a course.');

    const existing = await strapi.query('api::enrollment.enrollment').count({
      where: { student: studentId, course: courseId },
    });
    if (existing > 0) {
      throw new ValidationError('That student is already enrolled in this course.');
    }
  },
};
