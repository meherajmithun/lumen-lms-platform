import type { Core } from '@strapi/strapi';
import type { RoleType } from '../constants/roles';
import { roleOf, type AuthUser } from '../utils/auth';

/**
 * Coarse role gate, driven by route config:
 *   { name: 'global::has-role', config: { roles: ['admin', 'content_manager'] } }
 *
 * This answers "may this role call this endpoint at all". Record-level ownership
 * is a separate policy — see owns-course / owns-post.
 */
export default (
  policyContext: { state: { user?: AuthUser } },
  config: { roles?: RoleType[] },
  _ctx: { strapi: Core.Strapi }
) => {
  const allowed = config?.roles ?? [];
  const role = roleOf(policyContext.state.user);
  return role !== null && allowed.includes(role);
};
