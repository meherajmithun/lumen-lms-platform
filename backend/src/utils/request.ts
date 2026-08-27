import type { ApiContext } from './context';

/**
 * Merges server-owned filters on TOP of whatever the client sent.
 *
 * Order matters: ours last. If the client's filters won, `?filters[student]=3`
 * would let a student read another student's rows.
 */
export function scopeFilters(ctx: ApiContext, serverFilters: Record<string, unknown>): void {
  const clientFilters = (ctx.query.filters as Record<string, unknown> | undefined) ?? {};
  ctx.query = { ...ctx.query, filters: { ...clientFilters, ...serverFilters } };
}

/**
 * Deletes client-supplied fields that only the server may set — ownership
 * relations and anything score-related. Never trust the request body for these.
 */
export function stripProtectedFields(ctx: ApiContext, fields: string[]): void {
  const data = (ctx.request.body as { data?: Record<string, unknown> } | undefined)?.data;
  if (!data) return;
  for (const field of fields) delete data[field];
}

export function bodyData(ctx: ApiContext): Record<string, unknown> {
  const body = ctx.request.body as { data?: Record<string, unknown> } | undefined;
  if (!body) return {};
  if (!body.data) body.data = {};
  return body.data;
}

export const slugify = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Keeps only the fields a client is allowed to send, dropping everything else.
 *
 * Used where ownership is attached server-side: we never hand a client-shaped
 * object to the writer, we rebuild it from an explicit allowlist.
 */
export function pick<T extends Record<string, unknown>>(source: T, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}
