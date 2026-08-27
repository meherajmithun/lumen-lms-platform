import 'koa';
import type { AuthUser } from '../utils/auth';

/**
 * Strapi adds route params and a set of error helpers to every Koa context, but
 * they are not in @types/koa. Koa declares DefaultContext/DefaultState as
 * augmentable interfaces precisely for this, so we declare them once here rather
 * than casting the context in every controller.
 */
declare module 'koa' {
  interface DefaultContext {
    params: Record<string, string>;

    // strapi::errors helpers
    badRequest(message?: string, details?: unknown): unknown;
    unauthorized(message?: string, details?: unknown): unknown;
    forbidden(message?: string, details?: unknown): unknown;
    notFound(message?: string, details?: unknown): unknown;
    conflict(message?: string, details?: unknown): unknown;
    internalServerError(message?: string, details?: unknown): unknown;
  }

  interface DefaultState {
    user?: AuthUser;
  }
}
