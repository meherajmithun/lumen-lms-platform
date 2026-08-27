/**
 * The four application roles from the project spec.
 *
 * These are Users & Permissions roles (`up_roles`), which govern the public API.
 * They are NOT Strapi admin-panel roles (Super Admin / Editor / Author), which
 * only govern who can log into /admin. Two separate systems, two separate tables.
 */
export const ROLES = {
  ADMIN: 'admin',
  CONTENT_MANAGER: 'content_manager',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: RoleType[] = Object.values(ROLES);

/** Roles the permission matrix grants platform-wide content control ("any course"). */
export const PLATFORM_CONTENT_ROLES: RoleType[] = [ROLES.ADMIN, ROLES.CONTENT_MANAGER];

/** Roles a visitor may choose at sign-up. Admin and Content Manager are assigned by an admin only. */
export const SELF_ASSIGNABLE_ROLES: RoleType[] = [ROLES.STUDENT, ROLES.INSTRUCTOR];

export const ROLE_DEFINITIONS: Array<{ type: RoleType; name: string; description: string }> = [
  { type: ROLES.ADMIN,           name: 'Admin',           description: 'Full control of the platform. Manages users and assigns roles.' },
  { type: ROLES.CONTENT_MANAGER, name: 'Content Manager', description: 'Creates and manages courses, lessons and blog posts. Does not manage users.' },
  { type: ROLES.INSTRUCTOR,      name: 'Instructor',      description: 'Manages lessons and quizzes of their own courses, and sees their students’ progress.' },
  { type: ROLES.STUDENT,         name: 'Student',         description: 'Enrolls in courses, views lessons, takes quizzes and tracks their own progress.' },
];
