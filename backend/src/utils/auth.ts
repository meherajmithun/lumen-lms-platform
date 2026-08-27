import type { RoleType } from '../constants/roles';
import { PLATFORM_CONTENT_ROLES, ROLES } from '../constants/roles';

export type AuthUser = {
  id: number;
  username?: string;
  email?: string;
  role?: { id: number; type?: string; name?: string } | null;
};

/** The caller's role type, or null when unauthenticated. */
export const roleOf = (user?: AuthUser | null): RoleType | null =>
  (user?.role?.type as RoleType | undefined) ?? null;

export const isAdmin = (user?: AuthUser | null) => roleOf(user) === ROLES.ADMIN;

/** Admin and Content Manager may act on any course; the matrix scopes Instructor to their own. */
export const hasPlatformContentAccess = (user?: AuthUser | null) => {
  const role = roleOf(user);
  return role !== null && PLATFORM_CONTENT_ROLES.includes(role);
};
