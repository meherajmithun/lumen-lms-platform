import { cookies } from 'next/headers';
import { TOKEN_COOKIE_NAME } from './session-token';

const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';

export class StrapiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

type FetchOptions = Omit<RequestInit, 'cache'> & {
  /** false = anonymous request that may be cached and tagged. */
  auth?: boolean;
  tags?: string[];
  revalidate?: number | false;
};

async function authHeader(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE_NAME)?.value;
  return token ? `Bearer ${token}` : null;
}

/**
 * The only place this app talks to Strapi.
 *
 * Two rules are enforced here rather than left to each caller:
 *
 * 1. The JWT is read from an httpOnly cookie on the server and forwarded
 *    server-to-server. It never reaches browser JavaScript, so an XSS bug
 *    cannot steal a session.
 *
 * 2. Authenticated requests are never cached. Next's data cache is keyed on the
 *    URL, not on who asked, so a cached per-user response is how one user ends up
 *    seeing another user's data. Only anonymous reads get tags and revalidation.
 */
export async function strapiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, tags, revalidate, headers, ...init } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Content-Type') && init.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const header = await authHeader();
    if (header) requestHeaders.set('Authorization', header);
  }

  const response = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: requestHeaders,
    ...(auth
      ? { cache: 'no-store' as const }
      : { next: { tags, ...(revalidate === undefined ? {} : { revalidate }) } }),
  });

  if (!response.ok) throw await toStrapiError(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Normalises Strapi's error shape into a safe, human-readable message. */
async function toStrapiError(response: Response): Promise<StrapiError> {
  let message = 'Something went wrong. Please try again.';
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body?.error?.message) message = body.error.message;
  } catch {
    // Non-JSON error body — keep the generic message.
  }

  if (response.status === 401) message = 'Please sign in to continue.';
  if (response.status === 403) message = "You don't have permission to do that.";

  return new StrapiError(message, response.status);
}

/** Turns any thrown value into something safe to render. */
export function toUserMessage(error: unknown): string {
  if (error instanceof StrapiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const strapiUrl = BASE;

/**
 * Upload URLs belong to the current Strapi deployment, not to the origin that
 * happened to be active when an editor copied the URL. This keeps media working
 * when local ports change and when data moves from localhost to Railway.
 */
export function resolveStrapiMediaUrl(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  try {
    const path = value.startsWith('/') ? value : new URL(value).pathname;
    if (!path.startsWith('/uploads/')) return value;
    return new URL(path, BASE).toString();
  } catch {
    return value;
  }
}
