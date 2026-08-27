# 12 — Submission, README & the 10-Minute Video

The video is stated to be what the reviewers "review most closely". Budget real time for it.

---

## 1. README (requirement C-8)

`README.md` at the repo root must contain, at minimum, *how to run it locally* and *which
features you completed*. Structure:

```markdown
# LMS — Learning Management System

Live frontend: https://<app>.vercel.app
Live backend:  https://<app>.up.railway.app
Video walkthrough: <link>

## Tech stack
Next.js 16 (App Router, TS) on Vercel · Strapi 5 (TS) + PostgreSQL on Railway
Tailwind v4 · shadcn/ui · zod · jose

## Features completed
| Requirement | Status | Where |
|---|---|---|
| Auth + 4 roles | ✅ | `backend/src/policies`, `frontend/src/lib/auth.ts` |
| Backend-enforced RBAC | ✅ | `backend/src/policies`, `permissions-map.ts` |
| Course management | ✅ | ... |
| Lessons (text / video) | ✅ | ... |
| Enrollment + My Courses | ✅ | ... |
| Sequential lesson viewing | ✅ | ... |
| Progress tracking | ✅ | ... |
| Quiz + auto-grading | ✅ | ... |
| Admin panel + stats | ✅ | ... |
| Blog draft/publish | ✅ | ... |

## Roles & permissions
<the matrix table>

## Running locally
### Prerequisites — Node 22, npm, Postgres (or SQLite)
### Backend
cd backend && cp .env.example .env && npm install && npm run develop   # :1337
### Frontend
cd frontend && cp .env.example .env.local && npm install && npm run dev # :3000

## Environment variables
<table of names + what each is for — NO values>

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@lms.test | ... |
| Content Manager | cm@lms.test | ... |
| Instructor | instructor.a@lms.test | ... |
| Student | student1@lms.test | ... |

## Architecture notes
- Why Postgres and not SQLite on Railway
- Why the JWT lives in an httpOnly cookie
- Why role permissions are seeded in `bootstrap()`
- Why quiz answers never reach the browser

## Project structure
<tree>
```

Reviewers open the README first. Demo credentials right there is the difference between them
seeing your admin panel and them not bothering.

---

## 2. Commit history (requirement C-7)

- Conventional Commits: `feat(scope):`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- One logical change per commit; the roadmap gives you ~50 messages
- Commit **as you go over several days** — the timestamps are visible
- Never `git push --force` over your own history
- Optional but nice: short-lived feature branches merged with `--no-ff`, so the graph shows
  deliberate structure

---

## 3. The 10-minute video script

All seven required segments (V-1 … V-7), timed. **10 minutes is a hard cap — aim for 9:30.**

| Time | Segment | Content |
|------|---------|---------|
| 0:00–0:30 | Intro | Your name, what you built, the stack in one sentence. Have the deployed app already open. |
| 0:30–3:00 | **V-1 Live demo** | Four browser profiles pre-logged-in. **Student:** browse → enroll → open lesson → mark complete → progress moves → **hard refresh, it persists** → take quiz → instant score. **Instructor/CM:** create a course → add a lesson → add a quiz question → write a blog post. **Admin:** admin panel stats → change a user's role. Move fast; this is a demo, not a tutorial. |
| 3:00–4:00 | **V-2 Data flow** | Pick **lesson completion**. Show the button → the Server Action → `lib/strapi.ts` attaching the JWT → the Strapi route → the policy → the controller → the DB row → the response updating the progress bar. One feature, all the way through. |
| 4:00–5:30 | **V-3 Backend RBAC** | Open `permissions-map.ts` and `owns-course.ts`. Then **run `scripts/rbac-check.sh` on camera** — a terminal full of PASS lines proves the enforcement is server-side. Then log in as Instructor A and try to edit Instructor B's course by URL → 403. Say: *"the frontend hides the button, but even with curl and a valid token, the backend refuses."* |
| 5:30–7:00 | **V-4 Progress logic, line by line** | The `lesson-progress` schema (student, lesson, course, completedAt). The `markComplete` upsert and **why it's idempotent**. The percentage formula and the zero-lesson guard. Why `course` is denormalised. Show the actual DB row. |
| 7:00–8:15 | **V-5 Quiz auto-grading** | `quiz.grade()` on screen, walked through. Then the killer moment: open DevTools → Network on the quiz page → show the payload has **no** `correctOptionId`. Then curl the submit endpoint with `{"score":100}` and show the stored score is the computed one. |
| 8:15–9:15 | **V-6 Admin panel + blog** | Admin changes a role, and the last-admin guard blocking a bad change. Then blog: write a post → save as **draft** → open its public URL in incognito → **404** → publish → refresh → visible. |
| 9:15–10:00 | **V-7 Deployment** | Railway: root dir `backend`, the variables list, `DATABASE_URL` as a **reference**. Vercel: root dir `frontend`, and the `NEXT_PUBLIC_` rule — "these two are server-only, and here's why". One closing sentence. |

### Recording tips
- Screen at **1080p**, editor font bumped to ~16–18px so code is readable
- Close Slack/email; silence notifications
- Rehearse once with a timer — the first take always runs long
- Speak in your own voice, plainly. Say *why*, not just *what* — "I chose X because Y" is
  what separates you from someone reading generated code aloud
- If you're 30 seconds over, cut demo time, never V-3/V-4/V-5 — those are the graded ones
- Have the terminal, editor, and four browser profiles arranged **before** you hit record

---

## 4. "Making it yours" (requirement C-9)

The spec is explicit: a fully AI-generated project is rejected, and the video is where that
becomes obvious. Concretely:

- **Type the differentiator logic yourself.** `quiz.grade()`, `markComplete()`, the
  ownership policies, `getProgressFor()`. If you can't retype them from memory, rewrite them
  until you can.
- **Keep `NOTES.md`** — a running log of decisions and dead ends. It's your video script and
  it's honest evidence of your own thinking.
- **Make deliberate choices you can defend**, e.g.:
  - Postgres over SQLite because Railway's filesystem is ephemeral
  - httpOnly cookies over localStorage because of XSS
  - a JSON `options` array + one `correctOptionId` because it makes the sanitisation rule
    auditable in a single line
  - `no-store` on authenticated fetches because of Next.js's shared cache
  - seeding permissions in `bootstrap()` because permissions are DB rows, not code
- **Add one thing the spec doesn't ask for** — the RBAC leak script, the last-admin guard, or
  un-mark-complete. Something small that shows judgement.
- **Be able to answer "why?" three levels deep** on any file you show.

---

## 5. Submission checklist (all four — S-1..S-4)

- [ ] **S-1** GitHub repo link — **public**, contains `backend/` and `frontend/`
  - [ ] Opened in an incognito window to confirm it's really public
  - [ ] README complete with local setup + feature list + demo credentials
  - [ ] Commit history shows progression over multiple days
  - [ ] No `.env`, no secrets, no `node_modules` committed
- [ ] **S-2** Vercel URL — loads, login works, all roles work
- [ ] **S-3** Railway URL — `/api` responds, `/admin` reachable
- [ ] **S-4** Video link — unlisted YouTube or Drive "anyone with the link", **verified in
      incognito**, ≤10:00, your own voice, all seven segments present
- [ ] Submitted **before** 30 Aug 2026, 11:59 PM (submit with hours to spare — do not test
      the form at 11:55)

---

## 6. Final 24-hour sweep

1. Reseed production so the demo data is clean
2. Full smoke test on production ([`10-testing-and-qa.md`](./10-testing-and-qa.md) §6)
3. `scripts/rbac-check.sh` against production → all PASS
4. `CHECKLIST.md` — every box ticked
5. Repo public, README final
6. Video uploaded and link tested in incognito
7. Railway credit sufficient for the next month (C-5)
8. Submit the form
9. Do **not** delete or make the repo private afterwards
