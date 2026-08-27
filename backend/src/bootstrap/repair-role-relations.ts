import type { Core } from '@strapi/strapi';
import { ROLES } from '../constants/roles';
import { duringCourseRoleRepair } from '../api/course/content-types/course/lifecycles';

type UserRelation = { id?: number; role?: { type?: string } | null } | null;

/** Reconciles historical relations created before role validation was strict. */
export async function repairRoleRelations(strapi: Core.Strapi): Promise<void> {
  const courses = await strapi.documents('api::course.course').findMany({
    fields: ['documentId', 'title', 'isPublished'],
    populate: { instructor: { populate: { role: true } } },
    limit: -1,
  });
  let repairedCourses = 0;
  for (const course of courses) {
    const instructor = course.instructor as UserRelation;
    if (instructor?.role?.type === ROLES.INSTRUCTOR) continue;
    await duringCourseRoleRepair(() => strapi.documents('api::course.course').update({
      documentId: course.documentId,
      data: { instructor: null, isPublished: false },
    }));
    repairedCourses += 1;
    strapi.log.warn(`[repair] course ${course.documentId} (${course.title}) needs an Instructor`);
  }

  const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
    fields: ['documentId'],
    populate: {
      student: { populate: { role: true } },
      course: { fields: ['documentId'] },
    },
    limit: -1,
  });
  let removedEnrollments = 0;
  for (const enrollment of enrollments) {
    const student = enrollment.student as UserRelation;
    const course = enrollment.course as { documentId?: string } | null | undefined;
    if (student?.role?.type === ROLES.STUDENT && course?.documentId) continue;
    await strapi.documents('api::enrollment.enrollment').delete({
      documentId: enrollment.documentId,
    });
    removedEnrollments += 1;
  }

  if (repairedCourses || removedEnrollments) {
    strapi.log.warn(
      `[repair] role relations reconciled: ${repairedCourses} course(s), ` +
      `${removedEnrollments} enrollment(s)`
    );
  }
}
