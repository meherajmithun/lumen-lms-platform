# 09 — Implementation Roadmap (step by step)

**Today: 26 Aug 2026. Deadline: 30 Aug 2026, 11:59 PM.**
Five calendar days, with Day 5 reserved for the video, buffer and submission.

Each step lists the **commit message** to use. Following them gives you ~50 meaningful
commits spread over real days — which is exactly what requirement **C-7** is looking for.

> **Golden rule of sequencing:** deploy on Day 1, not Day 4. A "works locally, broke on
> Railway" discovery on the last night is the single most common way this project fails.

---

## Phase 0 — Setup (Day 1 morning, ~2h)

| # | Task | Commit |
|---|------|--------|
| 0.1 | Work through [`05-accounts-and-third-party-setup.md`](./05-accounts-and-third-party-setup.md) §1–3: GitHub repo, Railway project + Postgres, Vercel project | — |
| 0.2 | `git init`, root `.gitignore`, `README.md` stub, commit the `docs/` folder | `chore: initialise repo with docs and gitignore` |
| 0.3 | Scaffold Strapi into `backend/` | `chore(backend): scaffold strapi 5 with typescript` |
| 0.4 | Scaffold Next.js into `frontend/` | `chore(frontend): scaffold next.js 16 app router with tailwind` |
| 0.5 | Root `README.md` with local-run instructions (satisfies C-8 early) | `docs: add local setup instructions` |
| 0.6 | GitHub Actions CI: lint + typecheck both apps | `ci: add lint and typecheck workflow` |

**Gate:** both apps start locally. `git log` shows ≥5 commits.

---

## Phase 1 — Deploy the empty shells (Day 1 midday, ~1.5h)

Do this **before** any feature work.

| # | Task | Commit |
|---|------|--------|
| 1.1 | `config/database.ts`, `server.ts`, `middlewares.ts` (CORS) for two environments | `chore(backend): configure db, server and cors for multi-environment` |
| 1.2 | Generate secrets; set all Railway variables; link `DATABASE_URL` by reference | — |
| 1.3 | Deploy Strapi to Railway; generate a domain; **create the Strapi admin user immediately** | — |
| 1.4 | Deploy Next.js to Vercel with `STRAPI_URL` + `SESSION_SECRET` | — |
| 1.5 | Set `FRONTEND_URL` on Railway → redeploy → confirm the Vercel page can reach `/api` (a health ping) | `chore: wire frontend to deployed strapi` |
| 1.6 | Record both live URLs in the README | `docs: add deployed urls` |

**Gate:** `https://<app>.vercel.app` renders and successfully fetches from
`https://<app>.up.railway.app`. **You now have S-2 and S-3.**

---

## Phase 2 — Data model (Day 1 afternoon, ~2.5h)

| # | Task | Commit |
|---|------|--------|
| 2.1 | `course` content type | `feat(backend): add course content type` |
| 2.2 | `lesson` | `feat(backend): add lesson content type` |
| 2.3 | `quiz` + `question` | `feat(backend): add quiz and question content types` |
| 2.4 | `enrollment` | `feat(backend): add enrollment content type` |
| 2.5 | `lesson-progress` | `feat(backend): add lesson progress content type` |
| 2.6 | `quiz-attempt` | `feat(backend): add quiz attempt content type` |
| 2.7 | `post` with **Draft & Publish enabled** | `feat(backend): add blog post content type with draft and publish` |
| 2.8 | Lifecycle validation hooks | `feat(backend): add lifecycle validation for lessons, enrollments and progress` |

**Gate:** all relations visible in the admin panel; a manually-created course with two
lessons round-trips through the REST API.

---

## Phase 3 — RBAC foundation (Day 2 morning, ~3h) ⭐ *the graded core*

| # | Task | Commit |
|---|------|--------|
| 3.1 | `src/policies/`: `is-authenticated`, `has-role`, `is-admin` | `feat(backend): add authentication and role policies` |
| 3.2 | `src/utils/ownership.ts` + `owns-course`, `is-enrolled`, `owns-post` | `feat(backend): add ownership policies for courses and posts` |
| 3.3 | `src/config/permissions-map.ts` — the declarative matrix | `feat(backend): declare role permission map` |
| 3.4 | `bootstrap()`: `ensureRoles` + `applyPermissionMap` + strip `Authenticated` | `feat(backend): idempotent role and permission bootstrap` |
| 3.5 | `POST /auth/register` override — whitelist role to student\|instructor | `feat(backend): restrict self-registration to student and instructor roles` |
| 3.6 | Apply policies to **every** course/lesson/quiz/post route; audit that no route is left bare | `feat(backend): enforce policies on all content routes` |
| 3.7 | Deploy to Railway; confirm the four roles exist in production | `chore: redeploy backend with rbac` |

**Gate:** the leak checklist in [`04-rbac-and-security.md`](./04-rbac-and-security.md) §9
passes locally via curl. Do not move on until it does.

---

## Phase 4 — Auth on the frontend (Day 2 afternoon, ~3h)

| # | Task | Commit |
|---|------|--------|
| 4.1 | `lib/strapi.ts` typed client with cache-safety rules | `feat(frontend): typed strapi client with cache-safety rules` |
| 4.2 | `lib/session.ts` (jose + httpOnly cookies), `lib/auth.ts` guards | `feat(frontend): httpOnly cookie session with server-side guards` |
| 4.3 | `app/api/auth/{login,register,logout}/route.ts` | `feat(frontend): login, register and logout route handlers` |
| 4.4 | Login + Register pages (role select limited to student/instructor) | `feat(frontend): login and registration pages` |
| 4.5 | `middleware.ts` with the `ROUTE_ROLES` map | `feat(frontend): role-aware middleware for protected routes` |
| 4.6 | `lib/permissions.ts` — the UI mirror of the matrix | `feat(frontend): centralise permission checks` |
| 4.7 | Dashboard shell: sidebar, role badge, user menu, theme toggle | `feat(frontend): dashboard shell with role-aware navigation` |
| 4.8 | `/403` page, `error.tsx`, `not-found.tsx`, `loading.tsx` | `feat(frontend): error, not-found and forbidden boundaries` |

**Gate:** log in as each of the four seeded roles; each lands on the right dashboard; typing
another role's URL redirects to `/403`.

---

## Phase 5 — Courses & lessons (Day 3 morning, ~3.5h)

| # | Task | Commit |
|---|------|--------|
| 5.1 | Course controller: scoping, `create` forcing instructor, ownership on update/delete | `feat(backend): course ownership scoping and crud` |
| 5.2 | Lesson controller + `order` handling | `feat(backend): lesson crud scoped to course ownership` |
| 5.3 | `/courses` + `/courses/[slug]` public pages | `feat(frontend): public course catalogue and detail pages` |
| 5.4 | `/teach` list + `/teach/courses/new` + editor Details tab | `feat(frontend): course management for instructors and content managers` |
| 5.5 | Lessons tab: add/edit/delete + reorder | `feat(frontend): lesson editor with ordering` |
| 5.6 | Enrollment endpoint + `GET /enrollments/mine` | `feat(backend): enrollment endpoint with duplicate protection` |
| 5.7 | Enroll button + `/my-courses` | `feat(frontend): course enrollment and my courses` |
| 5.8 | Lesson player with prev/next in sequence | `feat(frontend): sequential lesson player` |

**Gate:** core features **F-2, F-3, F-4** complete end to end. Deploy and test on production.

---

## Phase 6 — Progress tracking (Day 3 afternoon, ~2h) ⭐ *differentiator*

| # | Task | Commit |
|---|------|--------|
| 6.1 | `POST/DELETE /lessons/:id/complete` — idempotent upsert, enrollment-verified | `feat(backend): idempotent lesson completion endpoint` |
| 6.2 | `GET /courses/:id/progress` + `course.getProgressFor` service (0-lesson safe) | `feat(backend): course progress calculation service` |
| 6.3 | `GET /courses/:id/students-progress` for instructors/CM/admin (P-5) | `feat(backend): student progress roster for course owners` |
| 6.4 | Mark-complete button with `useOptimistic` + rollback | `feat(frontend): progress tracking with optimistic ui` |
| 6.5 | Progress bars on the player, My Courses cards, and dashboard | `feat(frontend): surface course progress across the app` |
| 6.6 | Students tab in the course editor | `feat(frontend): instructor view of student progress` |
| 6.7 | Unit tests for the percentage maths incl. 0 lessons | `test(backend): progress calculation edge cases` |

**Gate:** D-1.1 → D-1.4. Hard-refresh and the percentage holds. Two students in the same
course have independent progress.

---

## Phase 7 — Quiz & auto-grading (Day 4 morning, ~3h) ⭐ *differentiator*

| # | Task | Commit |
|---|------|--------|
| 7.1 | Quiz + question CRUD scoped by course ownership | `feat(backend): quiz and question management for course owners` |
| 7.2 | `GET /quizzes/:id/take` stripping `correctOptionId` | `feat(backend): quiz take endpoint with answer-key sanitisation` |
| 7.3 | `quiz.grade()` service + `POST /quizzes/:id/submit` persisting an attempt | `feat(backend): server-side quiz auto-grading` |
| 7.4 | `GET /quiz-attempts/mine` | `feat(backend): quiz attempt history endpoint` |
| 7.5 | Quiz builder UI in the course editor | `feat(frontend): quiz and question builder` |
| 7.6 | Quiz-taking UI + results screen | `feat(frontend): quiz taking with immediate scored results` |
| 7.7 | `/results` history page | `feat(frontend): quiz results history` |
| 7.8 | Unit tests: all questions right / all wrong / partial / unanswered / zero questions | `test(backend): quiz grading edge cases` |

**Gate:** D-2.1 → D-2.3. DevTools shows no `correctOptionId` in the take payload. A forged
`{"score":100}` in the submit body is ignored.

---

## Phase 8 — Admin panel (Day 4 afternoon, ~2.5h) ⭐ *differentiator*

| # | Task | Commit |
|---|------|--------|
| 8.1 | `GET /users` (admin, paginated, with role) | `feat(backend): admin user listing` |
| 8.2 | `PUT /users/:id/role` with last-admin + self-change guards | `feat(backend): admin role management with safety guards` |
| 8.3 | `GET /admin/stats` | `feat(backend): platform statistics endpoint` |
| 8.4 | `/admin` dashboard with stat cards (+ chart — load `/dataviz` first) | `feat(frontend): admin dashboard with platform stats` |
| 8.5 | `/admin/users` table with role change + confirm dialog | `feat(frontend): admin user role management` |
| 8.6 | `/admin/courses` — manage all courses/lessons platform-wide (D-3.3) | `feat(frontend): admin course management` |

**Gate:** D-3.1 → D-3.4. A non-admin hitting `/admin` gets 403 from **both** the middleware
and Strapi.

---

## Phase 9 — Blog (Day 4 evening, ~2.5h) ⭐ *differentiator*

| # | Task | Commit |
|---|------|--------|
| 9.1 | Post controller: force `author`, `owns-post`, **hard-force `status: published`** for public | `feat(backend): blog post crud with draft visibility control` |
| 9.2 | Publish / unpublish endpoints via the Document Service | `feat(backend): blog publish and unpublish actions` |
| 9.3 | Public `/blog` + `/blog/[slug]` with ISR, metadata and OG tags | `feat(frontend): public blog with seo metadata` |
| 9.4 | `/blog-admin` list with Draft/Published tabs and publish toggle | `feat(frontend): blog admin with draft and publish workflow` |
| 9.5 | Post editor (title, slug, excerpt, cover URL, body) | `feat(frontend): blog post editor` |
| 9.6 | `/admin/posts` — admin controls **every** post (D-4.4) | `feat(frontend): admin control over all blog posts` |

**Gate:** D-4.1 → D-4.5. A draft's public URL 404s in an incognito window.

---

## Phase 10 — Polish, hardening, seed (Day 5 morning, ~3h)

| # | Task | Commit |
|---|------|--------|
| 10.1 | Demo data seeding (users, courses, lessons, quizzes, 1 draft post, partial progress) | `feat(backend): demo data seeding for reviewers` |
| 10.2 | Run the full RBAC leak script against **production** | `test: rbac leak suite passes against production` |
| 10.3 | Empty states, skeletons, toasts everywhere they're missing | `feat(frontend): loading, empty and error states` |
| 10.4 | Accessibility pass (keyboard walkthrough, labels, contrast) | `fix(frontend): accessibility improvements` |
| 10.5 | Responsive pass at 360 / 768 / 1280 | `fix(frontend): responsive layout fixes` |
| 10.6 | `/web-quality-audit` on the Vercel URL; fix findings | `perf(frontend): lighthouse improvements` |
| 10.7 | `sitemap.ts`, `robots.ts`, favicon, OG image | `feat(frontend): seo essentials` |
| 10.8 | **Final README** — local setup, env vars, architecture, completed-features table, demo credentials | `docs: complete readme with setup and feature list` |

---

## Phase 11 — Video & submission (Day 5 afternoon/evening, ~3h)

Follow [`12-submission-and-video.md`](./12-submission-and-video.md).

| # | Task |
|---|------|
| 11.1 | Reset/reseed production so the demo is clean |
| 11.2 | Rehearse the 10-minute script once with a timer |
| 11.3 | Record (aim ~9:30; the cap is hard) |
| 11.4 | Upload unlisted; **verify the link in an incognito window** |
| 11.5 | Final `CHECKLIST.md` sweep |
| 11.6 | Submit all four links |

---

## Time budget summary

| Day | Focus | Hours |
|-----|-------|-------|
| Day 1 (26th) | Setup + deploy shells + data model | ~6 |
| Day 2 (27th) | RBAC backend + frontend auth | ~6 |
| Day 3 (28th) | Courses, lessons, enrollment, progress | ~5.5 |
| Day 4 (29th) | Quiz, admin panel, blog | ~8 |
| Day 5 (30th) | Polish, README, video, submit | ~6 |

**Total ≈ 31.5 h.** Tight but achievable. If you fall behind, cut in this order:
1. Charts on the admin dashboard (stat cards alone satisfy D-3.4)
2. Un-mark-complete
3. Dark mode
4. Lesson drag-reorder (▲▼ buttons are fine)
5. Sentry / Cloudinary / email

**Never cut:** backend RBAC enforcement, server-side quiz grading, progress persistence,
draft/published separation, the video. Those are the graded differentiators.

---

## Daily discipline

- **Push at least twice a day.** The commit graph is part of the evaluation (C-7).
- **Deploy at the end of every phase.** Never let local and production drift by more than a
  few hours.
- **Keep a `NOTES.md` scratchpad** of decisions as you make them — it becomes your video
  script and proves the work is yours (C-9).
