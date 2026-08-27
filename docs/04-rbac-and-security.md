# 04 — RBAC & Security (the graded centrepiece)

> "Getting this 4-role access control right — cleanly, without leaks — is itself part of
> what we're evaluating."
> "Enforce this on the backend, not just by hiding buttons."

This document is the design you will walk through on camera for **V-3**.

---

## 1. The five layers

| # | Layer | Runs on | Purpose | Is it security? |
|---|-------|---------|---------|-----------------|
| 1 | `middleware.ts` | Vercel Edge | Redirect logged-out / wrong-role users away from a URL | ❌ UX only |
| 2 | Server guards `requireRole()` | Vercel Node | Block render/mutation before it starts | ⚠️ Defence in depth |
| 3 | Strapi **route permissions** | Railway | Can this role call this endpoint at all? | ✅ |
| 4 | Strapi **policies** | Railway | Does this *specific record* belong to this user? | ✅ |
| 5 | Strapi **controllers/services** | Railway | Scope queries; sanitise input & output | ✅ |

**The rule to state out loud on video:** *layers 1 and 2 make the app pleasant; layers 3, 4
and 5 make it safe. If you deleted the entire frontend and hit Strapi with curl, every
permission in the matrix would still hold.* That sentence is the answer to F-1.4.

---

## 2. Layer 3 — route permissions (coarse)

Set in the Strapi admin under **Settings → Users & Permissions → Roles**, but **seeded in
code** (see §7) so production matches local.

| Endpoint | Public | Student | Instructor | Content Manager | Admin |
|----------|:------:|:-------:|:----------:|:---------------:|:-----:|
| `POST /auth/local`, `/auth/local/register` | ✅ | – | – | – | – |
| `GET /users/me` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /courses`, `/courses/:id` | ✅ (published only) | ✅ | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /courses` | ❌ | ❌ | ✅¹ | ✅ | ✅ |
| `GET/POST/PUT/DELETE /lessons` | ❌ | ✅ GET only² | ✅¹ | ✅ | ✅ |
| `POST/PUT/DELETE /quizzes`, `/questions` | ❌ | ❌ | ✅¹ | ✅ | ✅ |
| `GET /quizzes/:id/take` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /quizzes/:id/submit` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /quiz-attempts/mine` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `POST /enrollments` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /enrollments/mine` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `POST /lessons/:id/complete` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /courses/:id/progress` | ❌ | ✅ own² | ✅¹ | ✅ | ✅ |
| `GET /posts` (published) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /posts?status=draft` | ❌ | ❌ | ❌ | ✅ own | ✅ all |
| `POST/PUT/DELETE /posts` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET /users`, `PUT /users/:id/role` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /admin/stats` | ❌ | ❌ | ❌ | ❌ | ✅ |

¹ narrowed to **owned records** by a layer-4 policy.
² narrowed to **enrolled courses / own rows** by a layer-4 policy.

Note the two ❌ rows that most people get wrong: `POST /enrollments` and
`POST /quizzes/:id/submit` are **Student-only** — Admin included (per the matrix, P-7/P-8).

---

## 3. Layer 4 — policies (record-level ownership)

Reusable global policies in `backend/src/policies/`:

### `is-authenticated.ts`
```ts
export default (policyContext) => Boolean(policyContext.state.user);
```

### `has-role.ts` (config-driven)
```ts
// usage in routes: { name: 'global::has-role', config: { roles: ['admin', 'content_manager'] } }
export default (policyContext, config) => {
  const role = policyContext.state.user?.role?.type;
  return Boolean(role && config.roles.includes(role));
};
```

### `owns-course.ts` — the important one
```ts
// Admin & content_manager pass unconditionally (matrix: "any course").
// Instructor passes only if course.instructor.id === user.id.
// Everyone else fails.
export default async (policyContext) => {
  const user = policyContext.state.user;
  if (!user) return false;
  const role = user.role?.type;
  if (role === 'admin' || role === 'content_manager') return true;
  if (role !== 'instructor') return false;

  const courseId = resolveCourseIdFromRequest(policyContext); // params.id, or body.course, or via lesson/quiz parent
  if (!courseId) return false;

  const course = await strapi.documents('api::course.course').findOne({
    documentId: courseId,
    populate: { instructor: { fields: ['id'] } },
  });
  return course?.instructor?.id === user.id;
};
```

`resolveCourseIdFromRequest` is the piece to explain carefully on video: for
`PUT /lessons/:id` the course id is not in the URL, so the policy must **load the lesson and
walk up to its course** before deciding. A policy that only checks `ctx.params.id` is the
classic leak.

### `is-enrolled.ts`
Blocks a Student from reading lessons of a course they never enrolled in, and from marking
progress on it. Admin/CM/Instructor-owner bypass for viewing.

### `owns-post.ts`
Admin → any post (D-4.4). Content Manager → posts where `author.id === user.id` (D-4.5).
Everyone else → false.

### `is-admin.ts`
Thin wrapper over `has-role` with `['admin']`, applied to all user-management and stats
routes.

**Policy application** lives in each route file:
```ts
// src/api/course/routes/course.ts  (custom routes file)
{
  method: 'PUT',
  path: '/courses/:id',
  handler: 'course.update',
  config: {
    policies: [
      'global::is-authenticated',
      { name: 'global::has-role', config: { roles: ['admin','content_manager','instructor'] } },
      'global::owns-course',
    ],
  },
}
```

---

## 4. Layer 5 — controllers: scope, sanitise, never trust the body

Four rules. Every custom controller obeys all four.

### Rule 1 — the actor comes from the JWT, never the request
```ts
// ❌ NEVER
const studentId = ctx.request.body.data.student;
// ✅ ALWAYS
const studentId = ctx.state.user.id;
```
Applies to: enrollment.student, lesson-progress.student, quiz-attempt.student,
course.instructor, post.author. If a client sends those fields, **delete them** from the
payload before writing:
```ts
delete ctx.request.body.data.student;
delete ctx.request.body.data.score;
```

### Rule 2 — scope list queries by role
`GET /courses` for an Instructor in the teach view returns only `filters: { instructor: user.id }`.
`GET /enrollments/mine` always injects `filters: { student: user.id }`. A client-supplied
`filters` param is **merged under** ours, never over it:
```ts
const query = { ...ctx.query, filters: { ...(ctx.query.filters ?? {}), student: user.id } };
```
(Ours last — so `?filters[student]=3` cannot override it.)

### Rule 3 — sanitise output
```ts
// quiz.take — strip the answer key
const sanitised = quiz.questions.map(({ correctOptionId, ...q }) => q);
```
This is the line that satisfies "auto-grading is real". Prove it on video by opening
DevTools → Network on the quiz page and showing the payload has no `correctOptionId`.

### Rule 4 — 403 vs 404
Return `403 Forbidden` when the user is authenticated but not allowed, `404` when the
record doesn't exist. Do **not** return 404 to hide existence for this project — clear,
honest status codes are easier to demo and to defend.

---

## 5. Custom endpoints (the ones that carry the differentiator features)

| Endpoint | Who | What it does |
|----------|-----|--------------|
| `POST /api/auth/register` (override) | Public | Whitelists role to `student` \| `instructor` **only**. Any other value → 400. Prevents self-promotion to admin. |
| `POST /api/enrollments` | Student | Find-or-create; 409 on duplicate; verifies course `isPublished`. |
| `GET /api/enrollments/mine` | Student | Enrollments + course + progress % — powers "My Courses" (F-3.2). |
| `POST /api/lessons/:id/complete` | Student | Idempotent upsert of lesson-progress; verifies enrollment first. Returns the new course progress % so the UI updates in one round trip. |
| `DELETE /api/lessons/:id/complete` | Student | Un-mark (nice edge-case polish). |
| `GET /api/courses/:id/progress` | Student(own) / Instructor(own course) / CM / Admin | `{ completed, total, percent, lessons: [{id, completed}] }` |
| `GET /api/courses/:id/students-progress` | Instructor(own) / CM / Admin | Roster with each student's % — satisfies P-5 for instructors. |
| `GET /api/quizzes/:id/take` | Student | Quiz **without** `correctOptionId`. |
| `POST /api/quizzes/:id/submit` | Student | Grades server-side, stores a `quiz-attempt`, returns score + per-question correctness. |
| `GET /api/quiz-attempts/mine` | Student | Past results (D-2.3). |
| `GET /api/users` (scoped) | Admin | Paginated user list + role, for the admin panel. |
| `PUT /api/users/:id/role` | Admin | Change a user's role. **Guards: cannot demote the last admin; cannot change your own role.** |
| `GET /api/admin/stats` | Admin | `{ usersByRole, totalCourses, totalLessons, totalEnrollments, totalPosts }` (D-3.4). |

### The grading function (V-5 — have this on screen)
```ts
// src/api/quiz/services/quiz.ts
async grade(quizId: string, userId: number, submitted: Array<{questionId: string; selectedOptionId: string}>) {
  const quiz = await strapi.documents('api::quiz.quiz').findOne({
    documentId: quizId,
    populate: { questions: true },   // includes correctOptionId — server side only
  });
  if (!quiz) throw new NotFoundError('Quiz not found');

  const answerKey = new Map(quiz.questions.map(q => [q.documentId, q.correctOptionId]));
  const answers = quiz.questions.map(q => {
    const given = submitted.find(s => s.questionId === q.documentId);
    return {
      questionId: q.documentId,
      selectedOptionId: given?.selectedOptionId ?? null,
      correct: given?.selectedOptionId === answerKey.get(q.documentId),  // unanswered = wrong
    };
  });

  const totalQuestions = quiz.questions.length;
  const correctCount = answers.filter(a => a.correct).length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return { answers, correctCount, totalQuestions, score, passed: score >= quiz.passingScore };
}
```
Edge cases deliberately handled here — call each one out on video:
- quiz with **zero questions** → score 0, no divide-by-zero
- **unanswered** question → counted wrong, not skipped
- extra/unknown `questionId` in the payload → **ignored** (we iterate the quiz, not the submission)
- duplicate submissions → allowed as a new attempt; the UI shows the latest and the history

---

## 6. Frontend session design (layers 1–2)

### Login flow
1. `POST /api/auth/login` (Next Route Handler) receives email + password.
2. Server calls Strapi `POST /api/auth/local` → `{ jwt, user }`.
3. Server calls Strapi `GET /api/users/me?populate=role` → the role type.
   *Why the extra call? A Strapi JWT payload contains only `{ id, iat, exp }` — no role.
   Anyone who assumes the role is in the token ships a broken guard. Say this on video.*
4. Server sets **two httpOnly cookies**:
   - `lms_token` = the Strapi JWT (`httpOnly, secure, sameSite=lax, path=/`)
   - `lms_session` = our own **jose-signed** JWT `{ id, username, email, role }`, so the
     Edge middleware can read the role without a network call.
5. Redirect to the role's landing page.

Both cookies are httpOnly ⇒ **no token is ever readable by browser JavaScript**.

> The `lms_session` cookie is a *cache* of the role for routing. It is signed so it can't be
> forged, but it is never trusted for authorisation — Strapi re-derives the role from the
> JWT on every request. If an admin demotes a user mid-session, the stale cookie may show
> them an admin link, and Strapi will still return 403. That's the correct trade-off, and
> it's the kind of nuance the interviewers are listening for.

### `middleware.ts`
```ts
const ROUTE_ROLES: Record<string, Role[]> = {
  '/admin':        ['admin'],
  '/teach':        ['admin', 'content_manager', 'instructor'],
  '/blog-admin':   ['admin', 'content_manager'],
  '/my-courses':   ['student'],
  '/learn':        ['student'],
  '/dashboard':    ['admin', 'content_manager', 'instructor', 'student'],
};
```
No session → redirect to `/login?next=<path>`. Wrong role → redirect to `/403`.

### Server guards
```ts
// lib/auth.ts
export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();          // reads cookie, verifies signature
  if (!user) redirect('/login');
  if (!roles.includes(user.role)) forbidden();  // renders the 403 page
  return user;
}
```
Called at the top of **every** protected page and **every** Server Action. A Server Action
is a public HTTP endpoint — guarding only the page that renders the form is a leak.

### `lib/permissions.ts` — one source of truth for the UI
```ts
export const can = {
  manageUsers:    (r: Role) => r === 'admin',
  createAnyCourse:(r: Role) => r === 'admin' || r === 'content_manager',
  editCourse:     (r: Role, c: Course, uid: number) =>
                    r === 'admin' || r === 'content_manager' ||
                    (r === 'instructor' && c.instructor?.id === uid),
  manageBlog:     (r: Role) => r === 'admin' || r === 'content_manager',
  enroll:         (r: Role) => r === 'student',
  takeQuiz:       (r: Role) => r === 'student',
};
```
Every conditional render imports from here. One file mirrors the PDF's matrix, so the UI can
never drift from it — and you can put that file side by side with the PDF table on video.

---

## 7. Seeding roles & permissions in code (the deployment gotcha)

**Strapi content-type schemas are in git and deploy fine. Role permissions are rows in the
database and do NOT.** Configure permissions by clicking in your local admin panel and
production will have none of them — your deployed app breaks with 403s everywhere. This
catches out a large share of candidates.

Solution: an idempotent `bootstrap()` in `backend/src/index.ts` that on every boot:
1. Ensures the four roles exist (create if missing, by `type`).
2. Sets each role's permission set from a declarative map in `src/config/permissions-map.ts`.
3. Strips all permissions from the default `Authenticated` role.
4. Grants `Public` only: auth endpoints, published post read, published course read.
5. Optionally seeds demo data if `SEED_DEMO_DATA=true` **and** the users table is empty.

```ts
// src/index.ts
export default {
  async bootstrap({ strapi }) {
    await ensureRoles(strapi);
    await applyPermissionMap(strapi);          // idempotent, safe on every deploy
    if (process.env.SEED_DEMO_DATA === 'true') await seedDemoData(strapi);
  },
};
```

This one file is worth ~90 seconds of the video (covers V-3 and V-7 at once).

---

## 8. Other production-grade security items

| Item | Implementation |
|------|----------------|
| CORS | `config/middlewares.ts` — allow only `http://localhost:3000` and the exact Vercel origin. Not `*`. |
| Secrets | All Strapi secrets (`APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`) generated per-environment, set in Railway variables, never committed. `.env.example` documents the names only. |
| Login rate limiting | Strapi's `ratelimit` on `/auth/local` (built into users-permissions config) + a small in-memory limiter on the Next login route. |
| Password policy | zod: min 8 chars, at least one letter + one digit; validated client and server. |
| Cookies | `httpOnly`, `secure` in production, `sameSite=lax`, explicit `maxAge` matching JWT expiry. |
| Logout | Clears both cookies; `revalidatePath('/', 'layout')` so cached RSC output for that user is dropped. |
| Next.js cache safety | **Every authenticated fetch uses `cache: 'no-store'` or a user-scoped tag.** A shared cache entry on a per-user request is how Next.js apps leak one user's data to another. This is the #1 App Router security bug — call it out on video. |
| Input validation | zod on every Server Action + Strapi lifecycle validation, so direct API calls are validated too. |
| Error messages | Never echo Strapi internals to the browser; normalise to safe messages in `lib/strapi.ts`. |
| Last-admin protection | `PUT /users/:id/role` refuses if it would leave zero admins, and refuses self-role-change. |
| Public blog | The public post controller hard-sets `status: 'published'` — a `?status=draft` query from the public is ignored, not honoured. |

---

## 9. The leak checklist (run before submitting)

Every one of these must fail with 401/403. The runnable script is in
[`10-testing-and-qa.md`](./10-testing-and-qa.md).

- [ ] Logged out: `GET /api/users` → 403
- [ ] Logged out: `GET /api/posts?status=draft` → no drafts in response
- [ ] Student: `POST /api/courses` → 403
- [ ] Student: `PUT /api/users/1/role` → 403
- [ ] Student: `GET /api/quizzes/:id/take` → response contains **no** `correctOptionId`
- [ ] Student: `POST /api/quizzes/:id/submit` with `{score: 100}` in body → stored score is the computed one
- [ ] Student A: `GET /api/courses/:id/progress` for Student B → 403 / own data only
- [ ] Instructor A: `PUT /api/courses/:idOwnedByB` → 403
- [ ] Instructor A: `POST /api/lessons` with `course = B's course` → 403
- [ ] Instructor: `POST /api/posts` → 403 (matrix P-6)
- [ ] Content Manager: `GET /api/users` → 403 (matrix P-1)
- [ ] Content Manager: `POST /api/enrollments` → 403 (matrix P-7)
- [ ] Admin: `POST /api/enrollments` → 403 (matrix P-7)
- [ ] Register with `{"role":"admin"}` → 400, user created as student or rejected
- [ ] Enroll twice in the same course → 409, exactly one enrollment row
- [ ] Mark the same lesson complete twice → one progress row, percentage unchanged
