# Submission-Readiness Implementation Plan

## Summary

The PDF's required product features are largely implemented, and the frontend
lint/type checks and Strapi build currently pass. With the 30 August 2026
deadline approaching, the next phase should focus on stabilization, automated
verification, deployment, and the mandatory walkthrough rather than adding
another feature.

The main current risks are:

- Deleted courses can leave enrollments whose `course` relation is `null`,
  crashing `/my-courses`.
- `/platform-stats` has returned `403` for an Admin during manual testing.
- Base UI reports uncontrolled-field warnings in editable forms.
- A large cross-cutting change set remains uncommitted.
- The unit tests described in the QA documentation do not exist, so CI's
  backend test step currently runs no tests.
- Deployment, responsive/accessibility checks, Lighthouse, and all video and
  submission requirements remain unverified.

## Implementation Status — 27 August 2026

Completed locally:

- Startup repair removes enrollments with missing courses or invalid students.
- Course and lesson deletion clean related enrollment/progress rows.
- `/enrollments/mine` and the frontend tolerate historical missing relations.
- Admin platform statistics return `200`; other roles remain forbidden.
- Changing Base UI fields are remounted with stable record/query keys.
- Vitest is installed and CI now requires the backend test suite.
- Eleven grading/progress unit tests pass.
- The strengthened direct-API RBAC suite passes 36 checks with no skips.
- Backend production build and frontend webpack production build pass.
- A live local create → enroll → delete regression test returned no orphan
  enrollment.

Still requires manual or external completion:

- Browser verification that no uncontrolled-field warnings remain.
- Responsive, keyboard, theme, and Lighthouse passes.
- Railway/PostgreSQL and Vercel deployment.
- Production smoke/RBAC tests, README live URLs, video, and submission.

## Phase 1 — Stabilize Data and Permissions

### Data integrity

- Extend startup repair logic to remove enrollments with a missing course or an
  invalid student and clean invalid lesson-progress records.
- Prevent new orphan records when courses or lessons are deleted by explicitly
  cleaning related enrollments and progress records.
- Make `GET /enrollments/mine` omit invalid historical records.
- Represent `Enrollment.course` as nullable at the API boundary instead of
  claiming that an external relation can never be absent.
- Add a defensive frontend filter so `/my-courses` and account statistics never
  dereference a missing course.

### Permission correctness

- Restart Strapi against a fresh local database and confirm that
  `plugin::users-permissions.user.stats` is registered and assigned to Admin.
- Require `GET /api/platform-stats` to return `200` for Admin.
- Require the same endpoint to return `403` for Student, Instructor, Content
  Manager, and anonymous callers.
- Correct permission registration on the backend; do not conceal a permission
  failure with a frontend fallback.
- Re-run the complete RBAC script after every permission change.

### Phase 1 acceptance criteria

- `/my-courses` renders even when historical records reference deleted content.
- Deleting a course cannot create another broken enrollment response.
- Admin dashboard statistics load successfully.
- The RBAC script reports zero failures.

## Phase 2 — Finish and Commit the Current Work

Preserve the existing working tree and divide it into reviewable commits:

1. Backend relation validation, data repair, and permission fixes.
2. Course ownership assignment, quiz/question management, and progress fixes.
3. Frontend course/lesson editor and navigation fixes.
4. Catalogue search, video handling, and UI polish.
5. Automated tests and documentation updates.

Before each commit, run `git diff --check`. After the full sequence, require:

```bash
cd frontend
npm run lint -- --max-warnings=0
npx tsc --noEmit

cd ../backend
npx tsc --noEmit
npm run build
```

Also confirm that:

- `git status` is clean.
- `.env`, `.env.local`, SQLite databases, build output, and `node_modules` are
  not tracked.
- Each commit contains one explainable behavior change.

## Phase 3 — Add Real Automated Coverage

### Backend unit tests

- Add Vitest and a real `test` script so CI does not succeed through
  `npm test --if-present` while running no tests.
- Extract or expose pure scoring and percentage helpers where needed.
- Cover quiz grading:
  - all answers correct;
  - all answers wrong;
  - unanswered questions;
  - unknown question IDs;
  - duplicate answers handled deterministically;
  - a quiz with zero questions;
  - a client-supplied score being ignored;
  - the passing-score boundary.
- Cover progress calculation:
  - zero lessons;
  - partial and complete progress;
  - duplicate completion;
  - cross-student isolation;
  - enrollment status synchronization.
- Add regression coverage for orphan enrollments and course deletion cleanup.

### Backend authorization checks

- Expand `scripts/rbac-check.sh` to verify all four roles.
- Cover cross-instructor course, lesson, quiz, and question ownership.
- Verify platform-stat permissions, answer-key secrecy, draft-post secrecy,
  registration privilege escalation, duplicate enrollment, and score tampering.
- Supply real course and quiz IDs during final verification so security
  assertions cannot be skipped.

### CI acceptance criteria

- Frontend lint and TypeScript checks pass.
- Backend TypeScript, build, and unit tests pass.
- CI fails when a test fails or when no intended test suite runs.

## Phase 4 — Remove Runtime Warnings and Complete Quality Checks

- Resolve Base UI uncontrolled-field warnings by either:
  - remounting an edit form with a stable entity key when the selected record
    changes; or
  - using controlled state when a field must change after initialization.
- Add route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` boundaries to
  the principal marketing, learning, teaching, admin, and blog routes.
- Test layouts at 360px, 768px, and 1280px in light and dark themes.
- Perform a keyboard-only pass through:
  - login and registration;
  - course enrollment;
  - lesson completion;
  - quiz submission;
  - course and lesson editing;
  - blog publishing;
  - user-role management.
- Run Lighthouse on `/`, `/courses`, and `/blog` and address issues until both
  performance and accessibility reach at least 90.
- Defer purely cosmetic enhancements until correctness and submission checks
  pass.

## Phase 5 — Deploy and Verify Production

Deploy in this order:

1. Create Railway PostgreSQL.
2. Deploy Strapi from the `backend` root directory.
3. Deploy Next.js to Vercel from the `frontend` root directory.
4. Set Railway's `FRONTEND_URL` to the Vercel URL and redeploy Strapi.
5. Disable `SEED_DEMO_DATA` after the production demo dataset is established.

Run the production smoke test:

1. Register a new Student.
2. Browse and enroll in a course.
3. Complete a lesson and confirm progress survives a hard refresh.
4. Complete a course and verify 100% progress.
5. Take a quiz and verify the immediate and stored result.
6. As Instructor, create a course, lesson, quiz, and question and inspect the
   enrolled-student roster.
7. As Content Manager, create a draft post, confirm it returns 404 publicly,
   publish it, and confirm it becomes visible.
8. As Admin, load statistics and change another user's role.
9. Verify Instructor A cannot manage Instructor B's records.
10. Run `scripts/rbac-check.sh` against Railway with zero failures.

## Phase 6 — README, Video, and Submission

- Add the live Vercel and Railway URLs to the README.
- Confirm the README includes local setup, completed features, demo accounts,
  environment-variable guidance, and architecture decisions.
- Rehearse and record a walkthrough under ten minutes covering all seven PDF
  requirements:
  1. deployed role journeys;
  2. one complete frontend-to-Strapi data flow;
  3. backend RBAC enforcement;
  4. progress logic explained line by line;
  5. quiz auto-grading shown in code;
  6. Admin role management and blog draft-to-publish flow;
  7. Vercel, Railway, PostgreSQL, and environment configuration.
- Upload the video as unlisted or link-accessible.
- Open the public repository, frontend, backend, and video links in an incognito
  window.
- Submit before 30 August 2026, leaving several hours for recovery from a failed
  deployment or upload.

## Definition of Done

- All core and differentiator requirements from the PDF work in production.
- All role restrictions are enforced by Strapi and verified by direct API tests.
- No known runtime crashes or console warnings remain on the demonstrated paths.
- Frontend lint/type checks, backend build/type checks, unit tests, and RBAC
  checks pass.
- Lighthouse performance and accessibility are at least 90 on public pages.
- Git history is clean, logical, and contains no secrets or generated data.
- Vercel, Railway, GitHub, and video links work when logged out.
- Every item in `docs/CHECKLIST.md` is checked before submission.

## Assumptions

- Submission readiness is the priority; no new product feature is added before
  stabilization and deployment.
- Existing uncommitted work is intentional and must be preserved and reviewed.
- Next.js on Vercel and Strapi with PostgreSQL on Railway remain mandatory.
- Local demo data may be repaired automatically; production cleanup must be
  logged and verified before recording.
