# Learning Consistency Graph — Implementation Plan

## Goal

Add an accessible 14-day learning-time graph above the course sections on the
Student's **My Courses** page. Each date shows active learning time; days without
eligible reading or video playback remain at zero.

## Measurement Rules

- Text lessons count only while the page is visible, focused, and the student
  has interacted within the previous 60 seconds.
- Native, YouTube, and Vimeo videos count only while playback is active and the
  page remains visible.
- Empty text, missing/invalid video, paused video, hidden tabs, and idle tabs
  count zero.
- The client sends a heartbeat every 15 seconds. The server calculates elapsed
  time and caps each increment at 20 seconds; client-supplied durations are
  never accepted.
- Dates use UTC in v1 so aggregation remains consistent across browsers and
  deployment environments.

## Backend

Create a `learning-session` collection containing Student, Course and Lesson
relations plus `sessionKey`, `activityDate`, `activeSeconds`, `lastSequence`, and
`lastHeartbeatAt`.

Add Student-only endpoints:

```text
POST /api/learning-sessions/heartbeat
GET  /api/learning-sessions/mine?days=14
```

The heartbeat endpoint will derive the Student from the JWT, resolve Course from
Lesson, verify enrollment, reject invalid content, ignore duplicate/out-of-order
sequences, and use server timestamps. The history endpoint will return every UTC
date in the requested range (including zeros), plus total time, active days,
current streak, and longest streak.

Course and Lesson deletion and bootstrap repair will remove invalid learning
sessions. Only Students can record or read their own time.

## Frontend

- Add a same-origin Next.js heartbeat route so the Strapi JWT remains in its
  httpOnly cookie.
- Add a client tracker to the lesson player. Reading uses visibility/focus/recent
  activity; native video uses media events; YouTube and Vimeo use their player
  message APIs.
- Generate one UUID per lesson-page visit and increment a monotonic heartbeat
  sequence.
- Add a semantic CSS bar chart above **In Progress** on `/my-courses`.
- Make every bar keyboard focusable with a full date/duration label.
- Format values as `0 min`, `<1 min`, `24 min`, or `1h 25m`.

## Tests and Acceptance

- Unit-test date filling, zero days, duration aggregation, and streaks.
- Test duplicate sequences, capped elapsed time, and invalid activity inputs.
- Verify RBAC denies non-Students and cross-student reads.
- Verify text idle/visibility behavior and native/embedded video playback.
- Run frontend lint/type/build, backend type/build/tests, and `git diff --check`.

Done means active reading/video time persists across refreshes, inactive days
render as zero, idle or paused content is not counted, and history remains scoped
to the authenticated Student.

## Implementation Status — Complete Locally

- Learning-session persistence, secured heartbeat/history endpoints, UTC daily
  aggregation, cleanup, and permissions are implemented.
- Text, native video, YouTube, and Vimeo activity signals are connected to the
  heartbeat tracker.
- The accessible 14-day chart and summary are rendered on **My Courses**.
- Sixteen backend tests and all thirty-six RBAC checks pass.
- Backend and frontend production builds pass.
