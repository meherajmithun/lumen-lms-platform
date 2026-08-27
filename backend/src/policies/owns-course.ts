import type { Core } from '@strapi/strapi';
import { ROLES } from '../constants/roles';
import { hasPlatformContentAccess, roleOf, type AuthUser } from '../utils/auth';
import { isCourseOwner, resolveCourseId, type CourseSource } from '../utils/ownership';

/**
 * Record-level ownership for courses and everything hanging off them.
 *
 * Matrix:
 *   Admin, Content Manager -> any course
 *   Instructor             -> own courses only
 *   everyone else          -> denied
 *
 * Route config declares where the course id lives, so the lookup is explicit
 * rather than guessed:
 *   { name: 'global::owns-course', config: { from: 'lesson' } }
 */
export default async (
  policyContext: { state: { user?: AuthUser }; params?: Record<string, string>; request?: unknown },
  config: { from?: CourseSource },
  { strapi }: { strapi: Core.Strapi }
) => {
  const user = policyContext.state.user;
  if (!user) return false;

  // Platform-wide content roles bypass the ownership lookup entirely.
  if (hasPlatformContentAccess(user)) return true;
  if (roleOf(user) !== ROLES.INSTRUCTOR) return false;

  const courseId = await resolveCourseId(strapi, policyContext as never, config?.from ?? 'course');
  if (!courseId) return false;

  return isCourseOwner(strapi, courseId, user.id);
};
