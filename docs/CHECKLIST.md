# ✅ Master Traceability Checklist

Every requirement ID from [`01-spec-analysis.md`](./01-spec-analysis.md). Nothing ships
until every box is ticked.

## Constraints
- [ ] **C-1** Frontend is Next.js, deployed on Vercel
- [ ] **C-2** Backend is Strapi, deployed on Railway
- [ ] **C-3** No other framework or host anywhere in the stack
- [ ] **C-4** Submitted before 30 Aug 2026, 11:59 PM
- [ ] **C-5** Deployed app will stay live until interviews are over (credit budgeted)
- [x] **C-6** GitHub repo is public and contains both frontend and backend
- [x] **C-7** Commit history shows real progression (not one commit)
- [x] **C-8** README covers local setup and completed features
- [ ] **C-9** Own thinking is visible; you can explain every file

## Roles
- [x] **R-1** Admin exists with full platform control
- [x] **R-2** Content Manager: content + blog, **no** user management
- [x] **R-3** Instructor: own courses' lessons/quizzes + own students' progress
- [x] **R-4** Student: enroll, view, quiz, own progress
- [x] **R-5** Access differs strictly by role, with no leaks

## Permission matrix
- [x] **P-1** Manage users & roles → Admin only
- [x] **P-2** Create/edit/delete any course → Admin, CM; Instructor own only
- [x] **P-3** Add/edit/delete lessons → Admin, CM; Instructor own courses
- [x] **P-4** Create quizzes → Admin, CM; Instructor own courses
- [x] **P-5** View student progress → Admin, CM; Instructor own courses; Student own only
- [x] **P-6** Write/manage blog → Admin, CM only
- [x] **P-7** Enroll in a course → Student only
- [x] **P-8** Take quizzes → Student only

## Core features
- [x] **F-1.1** Sign up / login with a role per user
- [x] **F-1.2** Role-based protected routes (pages)
- [x] **F-1.3** Restricted actions blocked
- [x] **F-1.4** Enforced on the **backend**, not just hidden buttons
- [x] **F-2.1** Course CRUD per the matrix
- [x] **F-2.2** Multiple lessons per course, add/edit/delete
- [x] **F-2.3** Lesson = title + content; content is text **or** a video URL
- [x] **F-3.1** Student browses available courses and enrolls
- [x] **F-3.2** Enrolled courses appear separately under "My Courses"
- [x] **F-4.1** Student views lessons of enrolled courses **in sequence**

## Differentiators
- [x] **D-1.1** Student can mark a lesson complete
- [x] **D-1.2** Course progress percentage shown (3 of 5 = 60%)
- [x] **D-1.3** Accurate per student, per course
- [x] **D-1.4** Persists across refreshes
- [x] **D-2.1** Instructor/CM can add an MCQ quiz (question + options + correct answer)
- [x] **D-2.2** Student gets an automatic score immediately on submit
- [x] **D-2.3** Quiz result stored and viewable later
- [x] **D-3.1** Dedicated admin dashboard, admin role only
- [x] **D-3.2** Admin sees all users and can promote/change/remove roles
- [x] **D-3.3** Admin can view and manage all courses, lessons and blog posts
- [x] **D-3.4** Platform stats: users per role, total courses, total enrollments
- [x] **D-4.1** CM/Admin can write, edit, publish, delete posts (title + body + cover URL)
- [x] **D-4.2** Draft vs Published; drafts invisible to students/public
- [x] **D-4.3** Anyone can read the published list and open a single post
- [x] **D-4.4** Admin has full control over every post, including others'
- [x] **D-4.5** CM manages the posts they can create per the matrix

## Edge cases (explicitly rewarded)
- [x] Course with zero lessons → 0%, not `NaN`
- [x] Quiz with zero questions → score 0, no crash
- [x] Unanswered quiz question → counted wrong
- [x] Marking the same lesson complete twice → one row, idempotent
- [x] Enrolling twice in the same course → 409, one enrollment
- [x] Registering with `role: admin` → rejected
- [x] `score` sent in the submit body → discarded
- [x] `student` sent in an enrollment/progress body → ignored, JWT used
- [x] Client `filters[student]` cannot override server scoping
- [x] Last admin cannot be demoted; you cannot change your own role
- [x] Draft post's public URL → 404 when logged out
- [x] Instructor A cannot touch Instructor B's course, lesson, or quiz
- [x] Student cannot read lessons of a course they aren't enrolled in

## Next.js quality (see doc 07 §F8)
- [x] Server Components by default; `'use client'` only at interactive leaves
- [x] Authenticated fetches are `no-store` or user-scoped
- [ ] `loading.tsx` / `error.tsx` / `not-found.tsx` on every segment
- [x] Every Server Action independently guarded
- [x] zod validation on both client and server
- [x] Optimistic UI on lesson completion
- [x] Empty states everywhere
- [ ] Responsive at 360 / 768 / 1280
- [ ] Keyboard accessible; contrast ≥ 4.5:1 in both themes
- [x] SEO metadata + sitemap + robots
- [ ] Lighthouse ≥ 90 performance & accessibility on public pages
- [x] No secret carries a `NEXT_PUBLIC_` prefix; no token in localStorage

## Video (all seven)
- [ ] **V-1** Live demo across all three role journeys on the **deployed** app
- [ ] **V-2** Data flow for one feature, frontend → Strapi → back
- [ ] **V-3** Backend permission enforcement demonstrated
- [ ] **V-4** Progress tracking logic explained line by line
- [ ] **V-5** Quiz auto-grading shown in code
- [ ] **V-6** Admin role management + blog draft → publish flow
- [ ] **V-7** Vercel/Railway configuration and env var handling
- [ ] ≤ 10:00, screen recording, your own voice

## Submission
- [ ] **S-1** Public GitHub repo link (frontend + backend)
- [ ] **S-2** Live Vercel URL
- [ ] **S-3** Live Railway URL
- [ ] **S-4** Openable video link (verified in incognito)
