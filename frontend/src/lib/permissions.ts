import type { Course, Role } from '@/types/lms';
import { ROLES } from '@/types/lms';

/**
 * The spec's permission matrix, mirrored for the interface.
 *
 * This decides what to *show*. It is not security — Strapi enforces every one of
 * these rules again on the server. Keeping the mirror in one file means the UI
 * cannot quietly drift from the matrix it is supposed to reflect.
 *
 *   Action                        Admin  CM   Instructor  Student
 *   Manage users & roles            Y     -       -          -
 *   Create/edit/delete any course   Y     Y    own only      -
 *   Add/edit/delete lessons         Y     Y    own courses   -
 *   Create quizzes                  Y     Y    own courses   -
 *   View student progress           Y     Y    own courses  own only
 *   Write/manage blog posts         Y     Y       -          -
 *   Enroll in a course              -     -       -          Y
 *   Take quizzes                    -     -       -          Y
 */
const AUTHORS: Role[] = [ROLES.ADMIN, ROLES.CONTENT_MANAGER, ROLES.INSTRUCTOR];
const PLATFORM: Role[] = [ROLES.ADMIN, ROLES.CONTENT_MANAGER];

export const can = {
  manageUsers: (role: Role) => role === ROLES.ADMIN,
  viewAdminPanel: (role: Role) => role === ROLES.ADMIN,

  authorContent: (role: Role) => AUTHORS.includes(role),
  createCourse: (role: Role) => AUTHORS.includes(role),

  editCourse: (role: Role, course: Pick<Course, 'instructor'>, userId: number) =>
    PLATFORM.includes(role) ||
    (role === ROLES.INSTRUCTOR && course.instructor?.id === userId),

  manageBlog: (role: Role) => PLATFORM.includes(role),

  editPost: (role: Role) => PLATFORM.includes(role),

  enroll: (role: Role) => role === ROLES.STUDENT,
  takeQuiz: (role: Role) => role === ROLES.STUDENT,
  viewOwnProgress: (role: Role) => role === ROLES.STUDENT,
  viewStudentProgress: (role: Role) => AUTHORS.includes(role),
} as const;

/** Where each role lands after signing in. */
export const homeFor = (role: Role): string => {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.CONTENT_MANAGER:
    case ROLES.INSTRUCTOR:
      return '/teach';
    default:
      return '/my-courses';
  }
};
