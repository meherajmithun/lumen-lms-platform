import type { Core } from '@strapi/strapi';
import { hasPlatformContentAccess, type AuthUser } from '../utils/auth';

/**
 * Blog ownership.
 *   Admin           -> every post
 *   Content Manager -> every post
 *   everyone else   -> denied (the matrix gives Instructor and Student no blog rights)
 */
export default async (
  policyContext: { state: { user?: AuthUser } },
  _config: unknown,
  _ctx: { strapi: Core.Strapi }
) => {
  const user = policyContext.state.user;
  if (!user) return false;
  return hasPlatformContentAccess(user);
};
