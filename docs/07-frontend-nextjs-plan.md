# 07 — Frontend Build Plan (Next.js 16, App Router)

The spec singles out the Next.js side for "best practices". This document is what "done
properly" means here.

---

## F1. Scaffold

```bash
cd /Users/moinulhossain/development/projects/lms-cps
npx create-next-app@latest frontend --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --turbopack
cd frontend
npx shadcn@latest init
npx shadcn@latest add button input label card dialog dropdown-menu select textarea \
  table tabs badge avatar progress skeleton separator sonner form alert-dialog sheet
npm i zod react-hook-form @hookform/resolvers jose
```

**Commit:** `chore(frontend): scaffold next.js 16 app router with tailwind and shadcn`

---

## F2. Route structure (App Router)

```
src/app/
├── layout.tsx                    # <html>, fonts, ThemeProvider, <Toaster />
├── page.tsx                      # landing: hero + featured courses + latest posts
├── error.tsx  global-error.tsx  not-found.tsx  loading.tsx
├── 403/page.tsx
│
├── (marketing)/                  # PUBLIC — no auth required
│   ├── courses/page.tsx          # browse all published courses (F-3.1)
│   ├── courses/[slug]/page.tsx   # course detail + Enroll CTA
│   ├── blog/page.tsx             # published posts only (D-4.3)
│   └── blog/[slug]/page.tsx      # single post — SEO metadata + ISR
│
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx         # role select: Student | Instructor only
│
├── (dashboard)/                  # AUTHENTICATED — shared shell
│   ├── layout.tsx                # requireUser(); role-aware sidebar
│   ├── dashboard/page.tsx        # role-routed landing
│   │
│   ├── my-courses/page.tsx                      # student (F-3.2)
│   ├── learn/[courseSlug]/page.tsx              # course outline + progress bar
│   ├── learn/[courseSlug]/lessons/[id]/page.tsx # lesson player, prev/next (F-4.1)
│   ├── learn/[courseSlug]/quiz/[quizId]/page.tsx# take quiz
│   ├── results/page.tsx                         # past quiz attempts (D-2.3)
│   │
│   ├── teach/page.tsx                           # instructor + CM course list
│   ├── teach/courses/new/page.tsx
│   ├── teach/courses/[id]/page.tsx              # edit course
│   ├── teach/courses/[id]/lessons/page.tsx      # lesson CRUD + reorder
│   ├── teach/courses/[id]/quiz/page.tsx         # quiz + question builder
│   ├── teach/courses/[id]/students/page.tsx     # student progress roster (P-5)
│   │
│   ├── blog-admin/page.tsx                      # CM + admin: drafts & published
│   ├── blog-admin/new/page.tsx
│   ├── blog-admin/[id]/page.tsx
│   │
│   └── admin/                                   # ADMIN ONLY (D-3.1)
│       ├── page.tsx                             # stats dashboard (D-3.4)
│       ├── users/page.tsx                       # list + role management (D-3.2)
│       ├── courses/page.tsx                     # all courses (D-3.3)
│       └── posts/page.tsx                       # all posts incl. others' (D-4.4)
│
└── api/auth/
    ├── login/route.ts
    ├── register/route.ts
    └── logout/route.ts
```

Route groups `(marketing)`, `(auth)`, `(dashboard)` give three different layouts without
polluting the URL. Every `(dashboard)` page begins with a `requireRole(...)` call.

**Commit:** `feat(frontend): route skeleton with role-based route groups`

---

## F3. The data layer — `lib/strapi.ts`

One wrapper, used by everything. No bare `fetch` anywhere else in the app.

```ts
type StrapiFetchOptions = RequestInit & {
  auth?: boolean;              // attach the JWT from the cookie
  tags?: string[];             // cache tags for revalidateTag
  revalidate?: number | false; // ISR window for public data
};

export async function strapiFetch<T>(path: string, opts: StrapiFetchOptions = {}): Promise<T> {
  const url = `${process.env.STRAPI_URL}/api${path}`;
  const headers = new Headers(opts.headers);
  headers.set('Content-Type', 'application/json');

  if (opts.auth !== false) {
    const token = await getToken();                       // httpOnly cookie, server only
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    // ⚠️ authenticated requests must NEVER share a cache entry between users
    cache: opts.auth === false ? undefined : 'no-store',
    next: opts.auth === false ? { tags: opts.tags, revalidate: opts.revalidate } : undefined,
  });

  if (!res.ok) throw await toStrapiError(res);            // normalised, safe message
  return res.status === 204 ? (undefined as T) : res.json();
}
```

Three properties worth defending on video:
1. **The JWT never leaves the server.** Client Components never call Strapi directly.
2. **Authenticated reads are `no-store`.** Caching a per-user response under a shared key is
   how App Router apps leak user A's data to user B. Public reads (blog, course catalogue)
   *do* get tags + ISR, because they're identical for everyone.
3. **Errors are normalised.** Strapi's error shape never reaches the browser verbatim.

Typed resource modules sit on top: `lib/api/courses.ts`, `lessons.ts`, `enrollments.ts`,
`quizzes.ts`, `posts.ts`, `users.ts`, `stats.ts` — each exporting small named functions
(`getPublishedCourses()`, `getMyEnrollments()`, …). Components import those, never
`strapiFetch` directly.

**Commit:** `feat(frontend): typed strapi client with cache-safety rules`

---

## F4. Session & auth — `lib/session.ts`, `lib/auth.ts`

```ts
// session.ts
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createSession(jwt: string, user: SessionUser) {
  const session = await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime('7d').sign(secret);

  const jar = await cookies();
  const base = { httpOnly: true, secure: process.env.NODE_ENV === 'production',
                 sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 7 };
  jar.set('lms_token', jwt, base);
  jar.set('lms_session', session, base);
}
```

```ts
// auth.ts — used at the top of every protected page and Server Action
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => { /* verify */ });

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  return u;
}

export async function requireRole(...roles: Role[]) {
  const u = await requireUser();
  if (!roles.includes(u.role)) redirect('/403');
  return u;
}
```

`React.cache` wrapping `getCurrentUser` means one cookie verification per request even if
twelve components ask for the user.

**⚠️ Server Actions are public HTTP endpoints.** Guarding the page that renders the form is
not enough — every action calls `requireRole()` as its first statement. State this
explicitly on video; it's exactly the "not just hiding buttons" point applied to Next.js.

**Commit:** `feat(frontend): httpOnly cookie session with jose and server-side guards`
**Commit:** `feat(frontend): login, register and logout route handlers`

---

## F5. `middleware.ts`

```ts
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const required = matchRouteRoles(pathname);       // from ROUTE_ROLES map
  if (!required) return NextResponse.next();

  const session = await verifySession(req.cookies.get('lms_session')?.value);
  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);          // return here after login
    return NextResponse.redirect(url);
  }
  if (!required.includes(session.role)) return NextResponse.redirect(new URL('/403', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*','/admin/:path*','/teach/:path*',
                                  '/blog-admin/:path*','/my-courses/:path*','/learn/:path*','/results/:path*'] };
```

Say the quiet part out loud on video: **this is a redirect, not a security boundary.**

**Commit:** `feat(frontend): role-aware middleware for protected routes`

---

## F6. Mutations — Server Actions

Every write is a Server Action in `app/**/actions.ts`:

```ts
'use server';
export async function markLessonComplete(lessonId: string, courseSlug: string) {
  const user = await requireRole('student');                  // 1. guard first
  const parsed = z.string().min(1).safeParse(lessonId);       // 2. validate input
  if (!parsed.success) return { ok: false, error: 'Invalid lesson' };
  try {
    const result = await completeLesson(parsed.data);         // 3. backend re-checks everything
    revalidatePath(`/learn/${courseSlug}`);                   // 4. targeted invalidation
    return { ok: true, progress: result.progress };
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };            // 5. never leak internals
  }
}
```

That five-step shape is used by every action. Consistency is itself a best practice, and it
makes the video easy: explain it once, then say "every action follows this shape."

Client components consume actions via `useActionState` (pending state, server-returned
errors) and `useOptimistic` for the lesson-complete checkbox — the tick flips instantly and
rolls back if the server rejects.

Forms: one zod schema per entity in `lib/validation/`, used by `react-hook-form` on the
client *and* re-parsed inside the action. Client validation is UX; server validation is
truth.

**Commit:** `feat(frontend): server actions for course, lesson and quiz mutations`

---

## F7. Feature implementations

### Enrollment (F-3.1, F-3.2)
- `/courses` — public grid, server-rendered, ISR-tagged `courses`.
- Enroll button: Server Action → `POST /enrollments` → `revalidateTag('my-courses')` →
  redirect to `/learn/[slug]`.
- Already enrolled → the button becomes "Continue learning".
- Non-student roles → the button is absent *and* the action returns 403 if called.

### Lesson viewing in sequence (F-4.1)
- Lessons sorted by `order`.
- The player shows **Previous / Next**, disabled at the boundaries.
- A sidebar outline lists all lessons with completion ticks and the current one highlighted.
- Direct URL access to a lesson of a course you're not enrolled in → server guard + Strapi
  `is-enrolled` policy → 403 page.

### Progress tracking (D-1.x)
- "Mark as complete" button → optimistic tick → Server Action → Strapi upsert.
- `<Progress value={percent} />` in the course header, on the "My Courses" cards, and on the
  dashboard.
- Persistence is trivially demonstrated: hard-refresh on camera and the percentage holds
  (D-1.4). **Do this on camera** — the PDF asks for it by name.
- Edge cases: 0-lesson course → `0%` not `NaN`; re-clicking complete is a no-op; un-complete
  decrements correctly.

### Quiz (D-2.x)
- `/learn/[slug]/quiz/[id]` fetches via `GET /quizzes/:id/take` — payload has **no**
  `correctOptionId` (open DevTools on camera).
- Radio group per question, client-side "you have N unanswered" warning, confirm dialog.
- Submit → Server Action → `POST /quizzes/:id/submit` → results screen: score %, pass/fail
  badge, per-question correct/incorrect breakdown.
- `/results` lists all past attempts with dates and scores (D-2.3).

### Admin panel (D-3.x)
- `/admin` — stat cards: users per role, total courses, total lessons, total enrollments,
  total posts. `requireRole('admin')` at the top of the layout **and** every page.
- `/admin/users` — table with search + pagination; a role dropdown per row; changing it
  opens a confirm dialog ("Promote X to Content Manager?"); disabled for your own row;
  disabled when it would remove the last admin, with an explanatory tooltip.
- `/admin/courses` and `/admin/posts` — full CRUD across the platform, including other
  people's records (D-3.3, D-4.4).

### Blog (D-4.x)
- Public `/blog` + `/blog/[slug]` — ISR, `generateStaticParams`, `generateMetadata` with
  OpenGraph tags, cover image, reading time.
- `/blog-admin` — tabs for Drafts / Published; a **Publish** / **Unpublish** button that hits
  the publish endpoint; a "Preview" link for drafts visible only to CM/Admin.
- Demonstrate D-4.2 by opening a draft's public URL in a logged-out incognito window → 404.

**Commits:** one per feature — `feat(frontend): course browsing and enrollment`,
`feat(frontend): sequential lesson player`, `feat(frontend): progress tracking with optimistic ui`,
`feat(frontend): quiz taking and results`, `feat(frontend): admin dashboard and user role management`,
`feat(frontend): blog with draft and publish workflow`

---

## F8. Next.js best-practice checklist (this is what "properly" means)

**Rendering & data**
- [ ] Server Components by default; `'use client'` only for interactivity, pushed to leaves
- [ ] Public pages: ISR + cache tags. Authenticated pages: `no-store` or user-scoped tags
- [ ] `loading.tsx` + `<Suspense>` with real skeletons on every route segment
- [ ] `error.tsx` per segment and `global-error.tsx` at the root
- [ ] `not-found.tsx` and `notFound()` for missing courses/posts
- [ ] Parallel data fetching with `Promise.all` — no request waterfalls
- [ ] `generateStaticParams` for blog and course detail pages
- [ ] `revalidateTag` / `revalidatePath` after every mutation — no full-app invalidation

**Types & correctness**
- [ ] `strict: true`; zero `any` in `src/` (`@ts-expect-error` with a reason if truly needed)
- [ ] Strapi response types in `types/strapi.ts`, shared with the API modules
- [ ] zod schemas shared between client forms and Server Actions

**UX**
- [ ] Every async button has a pending state (`useActionState` / `useFormStatus`)
- [ ] Optimistic UI for lesson completion
- [ ] Toasts for success/failure, never `alert()`
- [ ] Empty states for: no courses, no enrollments, no posts, no quiz attempts
- [ ] Confirm dialogs for every destructive action
- [ ] Fully responsive at 360 / 768 / 1280 px

**SEO & metadata**
- [ ] Root `metadata` + per-page `generateMetadata`
- [ ] OpenGraph/Twitter tags on blog posts
- [ ] `sitemap.ts` and `robots.ts`
- [ ] `next/image` with width/height (avoid layout shift); `next/font` for fonts

**Accessibility**
- [ ] Semantic landmarks, one `<h1>` per page, logical heading order
- [ ] All interactive elements keyboard reachable; visible focus rings
- [ ] Labels tied to inputs; `aria-invalid` + `aria-describedby` on errors
- [ ] `aria-live` on the quiz result and progress announcements
- [ ] Colour contrast ≥ 4.5:1 in light and dark themes

**Performance**
- [ ] No client-side data fetching for initial render
- [ ] Dynamic import for heavy client-only widgets (rich text editor, charts)
- [ ] Lighthouse ≥ 90 on Performance and Accessibility for `/`, `/courses`, `/blog`

**Security**
- [ ] No secret without the `NEXT_PUBLIC_` rule being deliberately checked
- [ ] No token in `localStorage` / `sessionStorage`
- [ ] Every Server Action guarded independently of its page
- [ ] External links `rel="noopener noreferrer"`
- [ ] Rich text sanitised before rendering (or rendered as plain/markdown-escaped)
