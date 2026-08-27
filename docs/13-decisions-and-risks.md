# 13 — Decision Log & Risk Register

Keep this file updated as you build. It is your video script for "why" questions and your
evidence of independent thinking (C-9).

---

## Part A — Architecture Decision Records

### ADR-001 — Single monorepo, not two repos
**Context:** The submission form asks for *one* GitHub repository link containing both
frontend and backend.
**Decision:** One repo with `backend/` and `frontend/`. Vercel root dir = `frontend`,
Railway root dir = `backend`.
**Consequences:** One coherent commit history; both hosts support root-directory config;
watch-path config needed so a frontend commit doesn't rebuild Strapi.

### ADR-002 — PostgreSQL, not SQLite
**Context:** Strapi defaults to SQLite; Railway containers have an ephemeral filesystem.
**Decision:** Railway's managed Postgres via `DATABASE_URL`.
**Consequences:** All data survives redeploys. Requires SSL config with
`rejectUnauthorized: false`. *(If we had shipped SQLite, every redeploy would have wiped
users and courses — this is the highest-impact decision in the project.)*

### ADR-003 — Four users-permissions roles, not a `role` field on user
**Context:** We need four roles enforced at the API layer.
**Decision:** Real Strapi users-permissions roles (`admin`, `content_manager`, `instructor`,
`student`), created and permissioned by an idempotent `bootstrap()`.
**Alternatives rejected:** an enum field on the user — would require hand-rolling route
authorisation everywhere and bypasses Strapi's built-in permission layer.
**Consequences:** Route-level enforcement for free; record-level ownership still needs custom
policies; permissions must be seeded in code because they're DB rows.

### ADR-004 — Self-registration limited to Student and Instructor
**Context:** F-1.1 wants a role at signup, but an open role field is privilege escalation.
**Decision:** Override `POST /auth/register` to whitelist `student` and `instructor`. Admin
and Content Manager are assignable only by an Admin.
**Consequences:** Secure by default; matches how real platforms work; gives the admin panel a
purpose in the demo.

### ADR-005 — Strapi JWT in an httpOnly cookie, set by a Next.js Route Handler
**Context:** The token must reach Strapi but must not be stealable by XSS.
**Decision:** Login goes through a Next Route Handler which stores the JWT in an httpOnly
cookie plus a jose-signed `lms_session` cookie carrying the role for Edge middleware.
**Alternatives rejected:** localStorage (XSS-readable); NextAuth (an abstraction over auth we
must be able to explain line by line).
**Consequences:** No token in browser JS. Two cookies to manage. The session cookie can go
stale if an admin changes a role mid-session — accepted, because Strapi re-derives the role
on every request.

### ADR-006 — Quiz answers never leave the server
**Context:** Client-side grading is trivially cheatable.
**Decision:** `GET /quizzes/:id/take` strips `correctOptionId`; grading happens in
`quiz.grade()`; `score`/`passed` from the request body are discarded.
**Consequences:** The score is trustworthy. Costs one extra endpoint. Provable on camera in
15 seconds via DevTools.

### ADR-007 — Quiz belongs to a course, not a lesson
**Context:** The PDF says "add an MCQ quiz to a course".
**Decision:** `quiz → course` manyToOne. The schema allows multiple quizzes per course; the
UI surfaces one.
**Consequences:** Matches the spec literally; leaves room to grow.

### ADR-008 — Cover images as URL strings, not uploads
**Context:** The PDF explicitly says "a cover image URL is fine"; Railway's filesystem is
ephemeral so local uploads would vanish.
**Decision:** `coverImageUrl` string fields. Cloudinary is an optional stretch.
**Consequences:** Zero infrastructure, spec-compliant, and the reasoning is a good video
moment.

### ADR-009 — Admin cannot enroll or take quizzes
**Context:** The prose says Admin "can do everything"; the matrix marks Enroll and Take
quizzes as ❌ for Admin.
**Decision:** Follow the **matrix** — it is the normative table. "Can do everything" is read
as administrative scope.
**Consequences:** A defensible, explicitly-reasoned reading. Stated in the README so a
reviewer sees it was a decision, not an oversight. *(An admin who wants to test the student
flow uses a student account — which is also what a real platform would do.)*

### ADR-010 — Instructors are scoped to their own courses everywhere
**Context:** The matrix says "Own only" / "Own courses" in four separate rows.
**Decision:** A single `owns-course` policy that resolves the course id from params, body, or
the parent lesson/quiz, applied consistently.
**Consequences:** One place to reason about; the resolution helper is the piece to review
most carefully, since checking only `ctx.params.id` is the classic leak.

### ADR-011 — Authenticated fetches are `no-store`
**Context:** Next.js's data cache is shared across users by default.
**Decision:** `lib/strapi.ts` forces `cache: 'no-store'` for authenticated requests; only
public data gets tags + ISR.
**Consequences:** No cross-user leakage. Slightly less caching on dashboards — correct
trade-off.

### ADR-012 — Draft & Publish only on `post`
**Context:** D-4.2 maps exactly onto Strapi's native draft system; courses need a simpler
visibility flag that doesn't interfere with ownership filters.
**Decision:** Draft & Publish enabled for `post`; a plain `isPublished` boolean on `course`.
**Consequences:** The blog gets the native publish/unpublish actions; course queries stay
simple.

### ADR-013 — Permissions seeded in `bootstrap()`
**Context:** Content-type schemas deploy via git; role permissions are DB rows and don't.
**Decision:** An idempotent bootstrap applies a declarative permission map on every boot.
**Consequences:** Production always matches the declared matrix; the map is reviewable as
code next to the PDF's table; a fresh database is fully configured with zero clicking.

---

## Part B — Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R-1 | Deployment problems discovered on the last day | High | **Fatal** | Deploy empty shells on **Day 1** (Phase 1), before any feature work |
| R-2 | Production 403s because permissions weren't seeded | High | High | ADR-013 bootstrap; verify on production at the end of Phase 3 |
| R-3 | Railway credit runs out before interviews (C-5) | Medium | **Fatal** | Spending alert; budget a month; uptime monitor; check before each interview |
| R-4 | Video exceeds 10 minutes or misses a required segment | Medium | High | Timed script in doc 12; rehearse once; the seven segments are a checklist |
| R-5 | Video link isn't openable by reviewers | Low | **Fatal** | Unlisted (not Private); test in incognito |
| R-6 | Single-commit history (C-7 negative signal) | Low | Medium | ~50 pre-written commit messages in doc 09; push twice daily |
| R-7 | An RBAC leak the reviewer finds in 30 seconds | Medium | High | The leak script (doc 10) run against production; the manual matrix walkthrough |
| R-8 | Scope creep — polishing UI while a differentiator is unbuilt | High | High | Follow the phase order; the cut list in doc 09 |
| R-9 | Running out of time on Day 4/5 | Medium | High | Cut list in doc 09; never cut the five graded items |
| R-10 | Strapi 5 API differences from tutorials/memory (v4 → v5) | Medium | Medium | Consult the official Strapi 5 docs; expect `documentId`, Document Service, `status` param |
| R-11 | Can't explain your own code on camera | Low | **Fatal** | Type the differentiator logic yourself; `NOTES.md`; rehearse the walkthrough |
| R-12 | Secrets committed to a **public** repo | Low | High | `.gitignore` before the first commit; `.env.example` with names only; scan history before submitting |
| R-13 | Data lost mid-demo | Low | Medium | Manual Railway DB backup before recording |
| R-14 | Next.js cache leaks one user's data to another | Medium | High | ADR-011; verify by logging in as two users in two browsers |
| R-15 | CORS blocks the deployed frontend | Medium | Medium | `FRONTEND_URL` set and redeployed in Phase 1, not Phase 11 |

---

## Part C — Running notes

> Append as you build: surprises, dead ends, things you changed your mind about. This is the
> raw material for the video and the clearest proof the work is yours.

- **26 Aug** — Read the spec, wrote `docs/`. Key realisations: Railway's filesystem is
  ephemeral (⇒ Postgres); Strapi role permissions are DB rows that don't deploy (⇒ bootstrap
  seeding); Strapi JWTs carry only `{id}`, no role (⇒ the extra `/users/me` call at login).
- …
