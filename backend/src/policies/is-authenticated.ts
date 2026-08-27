import type { Core } from '@strapi/strapi';

/** Rejects anonymous callers before any handler runs. */
export default (policyContext: { state: { user?: unknown } }, _config: unknown, _ctx: { strapi: Core.Strapi }) =>
  Boolean(policyContext.state.user);
