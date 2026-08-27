import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  TOKEN_COOKIE_NAME,
  hasUsableStrapiToken,
  verifySessionCookie,
} from '@/lib/session-token';
import type { Role } from '@/types/lms';

/**
 * Routing, not security. (Next 16 renamed this convention from `middleware`.)
 *
 * This sends a logged-out visitor to the sign-in page and keeps a student out of
 * the admin URLs, so the app behaves sensibly. It is not what protects the data:
 * every page re-checks with requireRole(), and Strapi enforces the same matrix
 * again on every request. Delete this file and nothing becomes readable that was
 * not readable before — it only becomes ruder.
 */
const ALL_ROLES: Role[] = ['admin', 'content_manager', 'instructor', 'student'];

const ROUTE_ROLES: Array<[string, Role[]]> = [
  ['/dashboard', ALL_ROLES],
  ['/account', ALL_ROLES],
  ['/admin', ['admin']],
  ['/teach', ['admin', 'content_manager', 'instructor']],
  ['/blog-admin', ['admin', 'content_manager']],
  ['/my-courses', ['student']],
  ['/learn', ['student']],
  ['/results', ['student']],
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = ROUTE_ROLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!match) return NextResponse.next();

  const session = await verifySessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const hasToken = hasUsableStrapiToken(request.cookies.get(TOKEN_COOKIE_NAME)?.value);

  if (!session || !hasToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (!match[1].includes(session.role)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/teach/:path*',
    '/blog-admin/:path*',
    '/my-courses/:path*',
    '/learn/:path*',
    '/results/:path*',
  ],
};
