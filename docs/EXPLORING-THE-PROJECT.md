# Exploring the project

You've cloned the repo, run both servers, and you're looking at
http://localhost:3000. This walks you through the whole thing in about 25 minutes,
in an order that makes each piece explain the next.

Every demo account uses the password **`Passw0rd!`**.

> **Tip:** use a separate browser profile (or an incognito window) per role, so you
> can have a student and an admin signed in at the same time and flip between them.

---

## Part 1 · What the seed created (2 min)

The backend seeds itself on first boot. Nothing was typed in by hand.

**Where it comes from:** `backend/src/bootstrap/seed-demo.ts`, run from
`backend/src/index.ts`. It only creates what's missing, keyed on email or slug, so
it's safe to run on every boot and it repairs anything you delete.

| What | How much |
|---|---|
| Users | 7 — one admin, one content manager, two instructors, three students |
| Courses | 4 — two owned by each instructor |
| Lessons | 18, ordered, mostly reading with one video |
| Quizzes | 4, one per course, 4–5 questions each |
| Enrollments | 4, with partial progress so bars aren't all at 0% |
| Blog posts | 3 — two published, **one left as a draft on purpose** |

That draft post is there so you can prove drafts never reach the public.

**Want a clean slate?** Stop Strapi, delete `backend/.tmp/data.db`, start it again.
Roles, permissions and demo data rebuild themselves.

---

## Part 2 · See the roles exist (3 min)

Open **http://localhost:1337/admin**. The first visit asks you to create an
administrator — that's Strapi's own dashboard login, use anything you like.

> ⚠️ This is **not** the app's Admin role. Strapi has two separate user systems:
> admin-panel users (developers) and users-permissions users (your app's people).
> Everyone gets caught by this once.

Once inside:

1. **Content Manager** (left sidebar) → you'll see the 8 content types: Course,
   Lesson, Enrollment, Lesson Progress, Quiz, Question, Quiz Attempt, Post.
2. **Post** → 3 posts. Note that two say *Published* and one says *Draft*.
   > It shows **5 rows for 3 posts** — Strapi 5 keeps a draft *and* a published
   > version of each published document. That's correct, not a bug.
3. **Settings** (gear, bottom-left) → **Users & Permissions plugin → Roles**.

That last screen is the one worth looking at:

| Role | Permissions |
|---|---|
| Admin | ~27 |
| Content Manager | ~24 |
| Instructor | ~21 |
| Student | ~10 |
| Public | ~7 |
| **Authenticated** | **0 — deliberately stripped** |

Nobody clicked those ticks. `backend/src/config/permissions-map.ts` declares them
and `backend/src/bootstrap/apply-permissions.ts` applies them on every boot.

**Why that matters:** Strapi content types live in git and deploy fine, but role
permissions are *database rows* and don't. Configure them by clicking locally and
production boots with none of them, 403-ing everything. Seeding them from code is
what keeps the two identical.

---

## Part 3 · The student journey (7 min)

Sign in at http://localhost:3000 as **`student1@lms.test`**.

1. **My courses** — two courses with progress bars. One shows *3 of 4 · 75%*.
   Notice the bar is **segmented**, one block per lesson — because progress here is
   discrete (3 of 4 lessons), not a percentage of a continuum.
2. Open **Foundations of Web Development** → the outline. Completed lessons have a
   green tick; the rest are numbered.
3. Open **lesson 4** (the only unfinished one) → press **Mark as complete**.
   The tick and the bar move *instantly*, before the server answers.
4. **Press it again.** The percentage does not move. That's the endpoint being
   idempotent — clicking twice leaves exactly one database row.
5. **Hard-refresh the page** (`⌘R`). Still complete. Progress is stored per student
   on the server, not in your browser.
6. Go back to the course → **Take it** on the quiz.
   - **Open DevTools → Network before submitting.** Look at the
     `/quizzes/…/take` response: there is **no `correctOptionId`** anywhere. The
     answer key never leaves the server.
   - Leave one question blank and submit. The confirmation warns you, and the blank
     one counts as wrong.
7. You get a score immediately, with a per-question breakdown showing the correct
   answer — revealed only *after* grading.
8. **My results** → the attempt is stored with its score and date.

**Try to browse a course you're not enrolled in:** open
`http://localhost:3000/learn/designing-rest-apis` directly. You're bounced to the
public course page, because Strapi refuses lesson content to non-enrolled students.

---

## Part 4 · Teaching, and ownership (6 min)

Sign in as **`instructor.a@lms.test`**.

1. **My courses** → you see **exactly two**: *Foundations of Web Development* and
   *JavaScript in Practice*. The other two belong to instructor B and are invisible
   here.
2. Open one → four tabs: **Lessons**, **Quiz**, **Students**, **Details**.
   - *Lessons* — add one, reorder with the ▲▼ buttons, switch a lesson between
     Reading and Video. Choosing Video swaps the textarea for a URL field, and a
     YouTube link is converted to an embed automatically.
   - *Quiz* — add a question, mark one option correct. The note on that screen is
     the important bit: correct answers are stored server-side and never sent to a
     student.
   - *Students* — everyone enrolled, with their progress. This is the matrix's
     "View student progress → own courses" row.
3. **Now try to edit somebody else's course.** Grab a course id belonging to
   instructor B from the admin panel, and visit
   `http://localhost:3000/teach/courses/<that-id>`. You land on **403**.
   The page asks an ownership-guarded endpoint; a non-owner is refused before any
   editor renders.

Sign in as **`cm@lms.test`** (Content Manager) and look at the same list: **all
four courses**, because the matrix gives Content Managers the whole library. But
the sidebar has **no People link** — content managers don't manage users.

---

## Part 5 · The blog, draft → published (4 min)

Still as **`cm@lms.test`** → **Blog**.

1. Two tabs: **Drafts (1)** and **Published (2)**.
2. Open the draft, *Upcoming: instructor analytics*. Copy its slug.
3. **Open a private/incognito window** and visit
   `http://localhost:3000/blog/upcoming-instructor-analytics` → **404**.
   Also check `http://localhost:3000/blog` — the draft isn't listed.
4. Back in your signed-in window, press **Publish**.
5. Refresh the incognito window → the post is now there.
6. Press **Unpublish** → it 404s again.

**Why it holds:** Strapi normally honours `?status=draft` from anyone with read
permission. `backend/src/api/post/controllers/post.ts` *overwrites* that parameter
rather than reading it, so for anyone but a blog author the status is forced to
`published` no matter what was asked for.

---

## Part 6 · The admin panel (4 min)

Sign in as **`admin@lms.test`**.

1. **Overview** — counts for people, courses, lessons, enrollments, posts and quiz
   attempts, plus a people-by-role breakdown. The bar length carries the comparison
   and the number is always printed beside it, so it reads without colour.
2. **People** → the user table with a role dropdown on each row.
   - Your own row's control is **disabled** — you can't change your own role.
   - If there's only one admin, that row is locked too — you can't remove the last
     admin and lock everyone out.
   - Change **Sofia Student** to *Instructor*. Confirm the dialog.
   - Sign in as `student3@lms.test` — the sidebar now shows teaching, not learning.
     Change it back afterwards.
3. Note the sidebar as Admin: People, Courses, Blog. Compare with what an
   Instructor sees. `frontend/src/lib/permissions.ts` mirrors the matrix in one
   file so the UI can't drift from it.

---

## Part 7 · Prove it's really enforced on the server (3 min)

Everything above went through the UI. The interesting question is whether the rules
survive without it.

```bash
cd backend && npm run develop      # if not already running

# in another terminal, from the repo root:
bash scripts/rbac-check.sh http://localhost:1337
```

This logs in as each role over HTTP and attempts things they shouldn't be able to
do — with **no frontend involved at all**:

```
Instructor (matrix: own courses only, NO blog, NO user management)
  PASS  cannot write a blog post  (403)
  PASS  A cannot edit B's course  (403)
  PASS  A cannot delete B's course  (403)

Admin (matrix marks Enroll and Take quizzes as NOT permitted)
  PASS  cannot enroll in a course  (403)

Payload leaks
  PASS  no answer key in the student quiz payload
  PASS  draft blog posts are hidden from the public

31 passed, 0 failed
```

It cleans up after itself — every course it creates is deleted again.

Two tamper checks worth doing by hand:

```bash
# 1. Register as an admin — refused
curl -s -X POST http://localhost:1337/api/auth/local/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"x","email":"x@lms.test","password":"Passw0rd1","role":"admin"}'

# 2. Submit a quiz with a forged score — the stored score is the computed one
#    (see docs/10-testing-and-qa.md for the full recipe)
```

---

## Where to look in the code

Once you've clicked through, these are the files that carry the weight:

| Question | File |
|---|---|
| How are permissions declared? | `backend/src/config/permissions-map.ts` |
| How is "own courses only" enforced? | `backend/src/policies/owns-course.ts` |
| How does ownership get resolved from a lesson? | `backend/src/utils/ownership.ts` |
| How is a quiz graded? | `backend/src/api/quiz/services/quiz.ts` |
| Why can't students see the answer key? | `backend/src/api/quiz/controllers/quiz.ts` |
| How is progress stored and counted? | `backend/src/api/lesson/services/lesson.ts` |
| How are drafts kept private? | `backend/src/api/post/controllers/post.ts` |
| How does login work? | `frontend/src/app/api/auth/login/route.ts` |
| Where do the auth guards live? | `frontend/src/lib/auth.ts` |
| Why is caching a security concern? | `frontend/src/lib/strapi.ts` |

---

## Three things that surprised me while building this

Worth knowing, because they explain code that otherwise looks over-engineered.

**1. Strapi strips relations the caller can't read.** A Content Manager has no
permission to read users, so any payload containing an `instructor`, `author` or
`student` relation had that field silently removed — and `filters[instructor]` was
rejected as an invalid key. This bit three separate features. The fix, used
consistently, is to attach and query ownership through the Document Service
server-side rather than through user-facing input.

**2. A Strapi JWT contains only `{ id, iat, exp }` — no role.** Login makes a
second call to `/users/me` to find out who you are. And `/users/me` needed
overriding too, for reason #1 above.

**3. Next.js caches by URL, not by caller.** An authenticated fetch cached under a
shared key is how one user ends up seeing another's data. `lib/strapi.ts` pins
every authenticated request to `no-store`; only anonymous reads get tags and ISR.
