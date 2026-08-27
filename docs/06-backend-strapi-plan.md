# 06 — Backend Build Plan (Strapi 5)

Work through this top to bottom. Each numbered block ends with a commit.

---

## B1. Scaffold

```bash
cd /Users/moinulhossain/development/projects/lms-cps
npx create-strapi@latest backend --typescript --no-run --skip-cloud
cd backend && npm install
```
Choose: TypeScript = yes, database = SQLite for now (we parameterise it next), skip the
Strapi Cloud prompt, decline the example starter (we build our own content types).

`npm run develop` → <http://localhost:1337/admin> → create the local admin user.

**Commit:** `chore(backend): scaffold strapi 5 with typescript`

---

## B2. Configuration for two environments

### `config/database.ts`
Switch on `DATABASE_CLIENT` so local can be SQLite/Postgres and production is always
Postgres over `DATABASE_URL` with SSL. The Strapi 5 scaffold already supports this out of the box — set
`DATABASE_SSL=true` and `DATABASE_SSL_REJECT_UNAUTHORIZED=false` as env vars rather than
editing the file. Railway's managed Postgres needs SSL, and its certificate is not in the
public trust chain.

### `config/server.ts`
```ts
host: env('HOST', '0.0.0.0'),
port: env.int('PORT', 1337),
app: { keys: env.array('APP_KEYS') },
url: env('PUBLIC_URL', undefined),   // set to the Railway domain in prod
```

### `config/middlewares.ts`
Replace the default `strapi::cors` entry with an allowlist:
```ts
{
  name: 'strapi::cors',
  config: {
    origin: [env('FRONTEND_URL', 'http://localhost:3000'), 'http://localhost:3000'],
    methods: ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'],
    headers: ['Content-Type','Authorization','Origin','Accept'],
    credentials: true,
  },
}
```
Not `origin: '*'` — an explicit allowlist is the point.

### `.env.example`
Document every variable **by name only**, no values. Commit this; never commit `.env`.

**Commit:** `chore(backend): configure db, server and cors for multi-environment`

---

## B3. Content types

Build these in the admin **Content-Type Builder** (it writes `schema.json` files you then
commit), or hand-write the schema files. Order matters — create the parents first.

1. `course` → 2. `lesson` → 3. `quiz` → 4. `question` → 5. `enrollment` →
6. `lesson-progress` → 7. `quiz-attempt` → 8. `post`

Field-by-field definitions are in [`03-data-model.md`](./03-data-model.md) §2. Points to get
right while clicking:

- **Draft & Publish**: ON for `post` only. OFF for everything else.
- `course.slug` and `post.slug`: UID field attached to `title`.
- Every ownership relation (`course.instructor`, `enrollment.student`,
  `lesson-progress.student`, `quiz-attempt.student`, `post.author`) is a **manyToOne to
  `Users (from: users-permissions)`**.
- `question.options` and `quiz-attempt.answers` are **JSON** fields.
- Set `required` and `min`/`max` in the schema, not just in the frontend.

After the builder restarts Strapi, `git status` should show new files under
`src/api/*/content-types/*/schema.json`. **These are what deploy to Railway.**

**Commits (one per content type is ideal for C-7):**
`feat(backend): add course content type`, `feat(backend): add lesson content type`, …

---

## B4. Lifecycle hooks (validation that can't be bypassed)

`src/api/lesson/content-types/lesson/lifecycles.ts`
- `beforeCreate` / `beforeUpdate`: if `contentType === 'video'` require a valid `videoUrl`;
  if `text` require non-empty `body`. Throw `ValidationError` otherwise.

`src/api/enrollment/content-types/enrollment/lifecycles.ts`
- `beforeCreate`: reject if an enrollment for (student, course) already exists.

`src/api/lesson-progress/content-types/lesson-progress/lifecycles.ts`
- `beforeCreate`: reject duplicates for (student, lesson).

Lifecycle hooks run for *every* write path — REST, GraphQL, and the admin panel — so they
are the last line of defence behind the controllers.

**Commit:** `feat(backend): add lifecycle validation for lessons, enrollments and progress`

---

## B5. Policies

Create in `src/policies/` (global namespace → referenced as `global::name`):

| File | Purpose |
|------|---------|
| `is-authenticated.ts` | `ctx.state.user` exists |
| `has-role.ts` | config-driven role allowlist |
| `is-admin.ts` | shorthand for admin-only |
| `owns-course.ts` | admin/CM pass; instructor must own; resolves the course id from params, body, or parent lesson/quiz |
| `is-enrolled.ts` | student must have an enrollment for the course |
| `owns-post.ts` | admin any; CM own; else deny |

Put the shared id-resolution helpers in `src/utils/ownership.ts` so the policies stay short
and testable. Code sketches are in [`04-rbac-and-security.md`](./04-rbac-and-security.md) §3.

**Commit:** `feat(backend): add rbac policies for role and ownership checks`

---

## B6. Custom routes, controllers and services

For each API, add a `routes/custom-<name>.ts` file alongside the generated core router, and
override the core controller methods you need. **Never** leave a core route unprotected —
audit `src/api/*/routes/*.ts` at the end and confirm every route has a `config.policies`
array.

### `course`
- `find` / `findOne`: students & public see only `isPublished: true`; instructors in the
  teach view get `filters.instructor = me` when `?scope=mine`.
- `create`: force `instructor = ctx.state.user.id` (delete any body-supplied value).
- `update` / `delete`: policy `owns-course`.
- `GET /courses/:id/progress` → service `getProgressFor`.
- `GET /courses/:id/students-progress` → roster for instructors/CM/admin (P-5).

### `lesson`
- `find` / `findOne`: student must be enrolled (`is-enrolled`), sorted by `order`.
- `create`/`update`/`delete`: `owns-course` resolved via `body.course` or the lesson's parent.
- `POST /lessons/:id/complete` → service `markComplete` (idempotent upsert, returns new %).
- `DELETE /lessons/:id/complete` → un-mark.

### `enrollment`
- `POST /enrollments`: student-only; force `student` from JWT; 409 on duplicate; require the
  course to be published.
- `GET /enrollments/mine`: injects `filters.student = me` **after** the client's filters.

### `quiz`
- `GET /quizzes/:id/take`: student-only; **strips `correctOptionId`** from every question.
- `POST /quizzes/:id/submit`: student-only; calls `quiz.grade()`; persists a `quiz-attempt`;
  returns `{ score, correctCount, totalQuestions, passed, answers }`.
- create/update/delete: `owns-course` via the quiz's course.

### `quiz-attempt`
- `GET /quiz-attempts/mine`: student's own attempts, newest first (D-2.3).
- Disable the core `create`/`update`/`delete` routes entirely — attempts are only ever
  written by the grading service.

### `post`
- `find`/`findOne`: **hard-force `status: 'published'`** unless the caller is admin or CM.
- `create`: force `author = me`.
- `update`/`delete`: `owns-post`.
- `POST /posts/:documentId/publish` and `/unpublish` using the Document Service
  `publish()` / `unpublish()` — the draft → publish flow you demo for V-6.

### users & stats (`src/extensions/users-permissions/strapi-server.ts`)
- `GET /users` (admin) — paginated, includes `role`.
- `PUT /users/:id/role` (admin) — validates the target role type; **refuses if it would
  leave zero admins**; refuses changing your own role.
- `POST /auth/register` override — whitelist role to `student` | `instructor`.
- `GET /admin/stats` (admin) — one service doing counts per role, courses, lessons,
  enrollments, posts.

**Commits:** one per API — `feat(backend): course ownership scoping and progress endpoints`,
`feat(backend): quiz take endpoint with answer-key sanitisation`,
`feat(backend): server-side quiz auto-grading and attempt persistence`,
`feat(backend): idempotent lesson completion endpoint`,
`feat(backend): enrollment endpoint with duplicate protection`,
`feat(backend): blog draft/publish controls`,
`feat(backend): admin user role management with last-admin guard`,
`feat(backend): platform stats endpoint`

---

## B7. Bootstrap: roles, permissions, seed

`src/config/permissions-map.ts` — a declarative object:
```ts
export const PERMISSIONS: Record<RoleType, string[]> = {
  student: [
    'api::course.course.find', 'api::course.course.findOne',
    'api::lesson.lesson.find', 'api::lesson.lesson.findOne',
    'api::enrollment.enrollment.create', 'api::enrollment.enrollment.mine',
    'api::lesson.lesson.complete',
    'api::quiz.quiz.take', 'api::quiz.quiz.submit',
    'api::quiz-attempt.quiz-attempt.mine',
    'api::post.post.find', 'api::post.post.findOne',
    'plugin::users-permissions.user.me',
  ],
  instructor: [ /* ... */ ],
  content_manager: [ /* ... */ ],
  admin: [ /* ... */ ],
};
```

`src/bootstrap/ensure-roles.ts`, `apply-permissions.ts`, `seed-demo.ts`, wired in
`src/index.ts` (see [`04-rbac-and-security.md`](./04-rbac-and-security.md) §7).

Make every step **idempotent** — it runs on every Railway deploy. Seeding only fires when
`SEED_DEMO_DATA=true` *and* the users table is empty.

**Commit:** `feat(backend): idempotent role and permission bootstrap`
**Commit:** `feat(backend): demo data seeding for reviewers`

---

## B8. Local verification before deploying

```bash
cd backend && npm run develop
# in another terminal:
bash ../scripts/rbac-check.sh http://localhost:1337    # doc 10
```
Every assertion must pass locally before you touch Railway. Debugging RBAC against a remote
container is miserable.

**Commit:** `test(backend): rbac leak check script`

---

## B9. Things that will bite you (pre-read this section)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Everything 403s on Railway but works locally | Role permissions live in the DB and don't deploy | The `bootstrap()` permission seeding (B7) |
| All data gone after a redeploy | SQLite on Railway's ephemeral filesystem | Use the Postgres service + `DATABASE_URL` |
| `self signed certificate in certificate chain` | Railway Postgres SSL | set `DATABASE_SSL_REJECT_UNAUTHORIZED=false` |
| Relations come back as `null` | Strapi 5 doesn't populate relations by default | Explicit `populate` in every controller |
| `createdBy` is empty for API-created records | `createdBy` tracks **admin-panel** users only | Use your explicit `instructor`/`student`/`author` relation |
| Draft posts visible to the public | Client-supplied `?status=draft` honoured | Hard-force `status: 'published'` in the controller |
| Frontend gets CORS errors after deploy | `FRONTEND_URL` not set on Railway | Set it and redeploy |
| App boots then crashes on Railway | `HOST` defaults to `127.0.0.1` | `HOST=0.0.0.0` |
| Build OOM on Railway | Strapi admin build is memory-hungry | `NODE_OPTIONS=--max-old-space-size=2048` |
