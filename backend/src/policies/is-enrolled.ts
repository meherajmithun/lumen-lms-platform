import type { Core } from '@strapi/strapi';
import { ROLES } from '../constants/roles';
import { hasPlatformContentAccess, roleOf, type AuthUser } from '../utils/auth';
import { isCourseOwner, resolveCourseId, type CourseSource } from '../utils/ownership';

/**
 * Students may only read lessons of, and record progress against, courses they
 * have actually enrolled in. Course owners and platform content roles bypass this
 * so they can preview their own material.
 */
export default async (
  policyContext: { state: { user?: AuthUser }; params?: Record<string, string>; request?: unknown },
  config: { from?: CourseSource },
  { strapi }: { strapi: Core.Strapi }
) => {
  const user = policyContext.state.user;
  if (!user) return false;
  if (hasPlatformContentAccess(user)) return true;

  const courseId = await resolveCourseId(strapi, policyContext as never, config?.from ?? 'course');
  if (!courseId) return false;

  if (roleOf(user) === ROLES.INSTRUCTOR) return isCourseOwner(strapi, courseId, user.id);
  if (roleOf(user) !== ROLES.STUDENT) return false;

  const [enrollment] = await strapi.documents('api::enrollment.enrollment').findMany({
    filters: { student: { id: user.id }, course: { documentId: courseId } },
    fields: ['documentId'],
    limit: 1,
  });
  return Boolean(enrollment);
};
