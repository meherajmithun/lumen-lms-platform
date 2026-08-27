import type { Context } from 'koa';

/**
 * The request context as our controllers see it.
 *
 * Strapi's additions (route params, error helpers, the authenticated user) are
 * declared once in src/types/koa.d.ts, so this stays assignable to Strapi's own
 * controller handler signature.
 */
export type ApiContext = Context;
