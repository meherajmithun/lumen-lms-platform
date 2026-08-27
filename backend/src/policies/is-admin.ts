import type { Core } from '@strapi/strapi';
import { isAdmin } from '../utils/auth';
import type { AuthUser } from '../utils/auth';

/** Admin-only routes: user management and platform statistics. */
export default (policyContext: { state: { user?: AuthUser } }, _config: unknown, _ctx: { strapi: Core.Strapi }) =>
  isAdmin(policyContext.state.user);
