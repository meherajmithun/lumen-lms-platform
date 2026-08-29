import { ROLES, type RoleType } from '../constants/roles';

/**
 * The permission matrix from the spec, as code.
 *
 * Why this file exists: Strapi content-type schemas live in git and deploy fine,
 * but role permissions are rows in `up_permissions` — they do NOT deploy. Configure
 * them by clicking in a local admin panel and production boots with none of them,
 * returning 403 for everything. This map is applied idempotently on every boot, so
 * a fresh database is fully configured with zero clicking.
 *
 * Route-level only. Record-level ownership ("Instructor: own courses") is enforced
 * by the policies in src/policies, which these routes also carry.
 */

const AUTH_ACTIONS = [
  'plugin::users-permissions.auth.callback',      // POST /auth/local        (login)
  'plugin::users-permissions.auth.register',      // POST /auth/local/register
];

const SELF_ACTIONS = [
  'plugin::users-permissions.user.me',            // GET /users/me
  'plugin::users-permissions.user.updateProfile', // PUT /users/me/profile
  'plugin::upload.content-api.upload',             // POST /upload (profile image)
];

/** Reading published courses and posts is open to everyone, logged in or not. */
const PUBLIC_READ = [
  'api::student-story.student-story.approved',
  'api::enrollment-guide.enrollment-guide.current',
  'api::combo-offer.combo-offer.current',
  'plugin::users-permissions.user.publicInstructors',
  'api::course.course.find',
  'api::course.course.findOne',
  'api::course.course.bySlug',
  'api::post.post.find',
  'api::post.post.findOne',
];

const CONTENT_AUTHORING = [
  'plugin::users-permissions.user.instructors',
  'api::course.course.manage',
  'api::course.course.create',
  'api::course.course.update',
  'api::course.course.delete',
  'api::lesson.lesson.find',
  'api::lesson.lesson.findOne',
  'api::lesson.lesson.create',
  'api::lesson.lesson.update',
  'api::lesson.lesson.delete',
  'api::quiz.quiz.find',
  'api::quiz.quiz.findOne',
  'api::quiz.quiz.create',
  'api::quiz.quiz.update',
  'api::quiz.quiz.delete',
  'api::question.question.create',
  'api::question.question.update',
  'api::question.question.delete',
];

const BLOG_AUTHORING = [
  'api::post.post.create',
  'api::post.post.update',
  'api::post.post.delete',
  'api::post.post.publish',
  'api::post.post.unpublish',
];

/** Seeing enrolled students' progress — granted to course owners and platform content roles. */
const PROGRESS_OVERSIGHT = [
  'api::course.course.progress',
  'api::course.course.studentsProgress',
];

const STUDENT_LEARNING = [
  'api::student-story.student-story.submit',
  'api::enrollment-application.enrollment-application.submit',
  'api::enrollment-application.enrollment-application.mine',
  'api::lesson.lesson.find',
  'api::lesson.lesson.findOne',
  'api::enrollment.enrollment.mine',
  'api::lesson.lesson.complete',
  'api::lesson.lesson.uncomplete',
  'api::course.course.progress',
  'api::quiz.quiz.find',
  'api::quiz.quiz.findOne',
  'api::quiz.quiz.take',
  'api::quiz.quiz.submit',
  'api::quiz-attempt.quiz-attempt.mine',
  'api::learning-session.learning-session.heartbeat',
  'api::learning-session.learning-session.mine',
  'api::notification.notification.mine',
  'api::notification.notification.readAll',
];

const ADMIN_ONLY = [
  'plugin::users-permissions.user.instructorRequests',
  'plugin::users-permissions.user.approveInstructor',
  'plugin::users-permissions.user.rejectInstructor',
  'plugin::users-permissions.user.find',
  'plugin::users-permissions.user.findOne',
  'plugin::users-permissions.user.updateRole',
  'plugin::users-permissions.user.stats',
];

const ENROLLMENT_REVIEW = [
  'api::student-story.student-story.queue',
  'api::student-story.student-story.review',
  'api::enrollment-guide.enrollment-guide.save',
  'api::combo-offer.combo-offer.save',
  'api::enrollment-application.enrollment-application.queue',
  'api::enrollment-application.enrollment-application.review',
];

export const PERMISSIONS: Record<RoleType, string[]> = {
  // Matrix row: everything.
  [ROLES.ADMIN]: [
    ...SELF_ACTIONS,
    ...PUBLIC_READ,
    ...CONTENT_AUTHORING,
    ...BLOG_AUTHORING,
    ...PROGRESS_OVERSIGHT,
    ...ADMIN_ONLY,
    // Deliberately absent: enrollment.create and quiz.submit.
    // The matrix marks "Enroll in a course" and "Take quizzes" as ❌ for Admin.
  ],

  // Matrix row: all content + blog, no user management, no enrolling.
  [ROLES.CONTENT_MANAGER]: [
    ...SELF_ACTIONS,
    ...PUBLIC_READ,
    ...CONTENT_AUTHORING,
    ...BLOG_AUTHORING,
    ...PROGRESS_OVERSIGHT,
    ...ENROLLMENT_REVIEW,
  ],

  // Matrix row: own courses only. The same endpoints as a Content Manager, but every
  // one of them carries the owns-course policy, which narrows them to owned records.
  [ROLES.INSTRUCTOR]: [
    ...SELF_ACTIONS,
    ...PUBLIC_READ,
    ...CONTENT_AUTHORING,
    ...PROGRESS_OVERSIGHT,
    // Deliberately absent: BLOG_AUTHORING — the matrix gives Instructor ❌ on blog.
  ],

  // Matrix row: enroll, learn, quiz, own progress.
  [ROLES.STUDENT]: [
    ...SELF_ACTIONS,
    ...PUBLIC_READ,
    ...STUDENT_LEARNING,
  ],
};

/** The unauthenticated role. Login, registration, and published content only. */
export const PUBLIC_PERMISSIONS: string[] = [...AUTH_ACTIONS, ...PUBLIC_READ];

/**
 * Strapi's built-in "Authenticated" role is left in place but stripped to nothing,
 * so a user who somehow lands in it can do nothing at all.
 */
export const AUTHENTICATED_PERMISSIONS: string[] = [];
