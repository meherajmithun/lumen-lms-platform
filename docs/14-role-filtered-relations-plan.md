# Role-Filtered User Relations — Implementation Plan

## 1. Goal and current problem

The Strapi Content Manager currently shows every application user in both of
these relation selectors:

- `course.instructor`
- `enrollment.student`

Both fields target `plugin::users-permissions.user`, so Strapi's standard
relation endpoint has no knowledge of the role expected by the source field.
The enrollment lifecycle rejects a non-student after submission, but the picker
still suggests invalid users. Course validation is currently broader than the
field name implies and accepts Admin and Content Manager as instructors.

The completed behavior must be:

| Relation field | Options shown | Values accepted by backend |
|---|---|---|
| `course.instructor` | Users whose role type is `instructor` | Instructor users only |
| `enrollment.student` | Users whose role type is `student` | Student users only |

Filtering the UI is usability. Lifecycle/controller checks remain the security
boundary for direct REST calls, the admin panel, seed code, and future clients.

## 2. Backend implementation

### 2.1 Role-filtered Content Manager relation queries

Decorate Strapi's Content Manager `relations.findAvailable` controller during
application registration. Intercept only these exact source-field pairs:

```text
api::course.course / instructor      -> instructor
api::enrollment.enrollment / student -> student
```

All other relation fields must call the original Strapi controller unchanged.

For an intercepted request:

1. Call the Content Manager controller's existing request-information helper so
   Strapi still enforces admin authentication, source-field permissions, model
   existence, and relation metadata.
2. Query `plugin::users-permissions.user` with a database-level filter on
   `role.type`; do not fetch all users and filter one page in memory.
3. Preserve the relation picker's contract:
   - pagination via `page` and `pageSize`, capped at 100;
   - username search via `_q`, case-insensitive;
   - `idsToOmit` and `idsToInclude` handling;
   - fields needed by Strapi (`id`, `documentId`, `username`, timestamps);
   - response shape `{ results, pagination }`.
4. Keep this override in a focused module under `backend/src/extensions/` and
   register it from `backend/src/index.ts`.
5. Add a compatibility comment and test because this decorates a pinned Strapi
   5.52.1 internal Content Manager controller.

Do not introduce InstructorProfile or StudentProfile content types. Those would
duplicate identity data and require rewriting ownership, enrollment, progress,
quiz-attempt, seed, and permission logic solely to influence two dropdowns.

### 2.2 Strict write validation

- Change the course lifecycle invariant so `course.instructor` accepts only a
  user with role type `instructor`.
- Keep enrollment validation restricted to role type `student`.
- Require the appropriate relation on create; clearing it on update is rejected
  when the record would otherwise be left invalid.
- Use the generic relation resolver with the correct target UID for every
  relation value shape produced by REST, Document Service, and the admin panel.
- Return specific validation messages naming the expected and actual role.

### 2.3 Course creation and reassignment rules

Preserve the permission matrix while separating management permission from
course ownership:

- Instructor creates a course: backend assigns the authenticated instructor and
  ignores any client-supplied instructor.
- Admin or Content Manager creates a course: request must name a valid Instructor.
- Admin or Content Manager updates a course: may reassign it to another Instructor.
- Instructor updates a course: cannot change its instructor relation.
- Students cannot call any course write endpoint.

Add an authenticated, author-role endpoint that returns a minimal list of
Instructor users (`id`, `documentId`, `username`, `email`). It must be available
only to Admin, Content Manager, and Instructor; it must never expose passwords,
tokens, role records, or unrelated users.

### 2.4 Existing-data reconciliation

Add an idempotent startup audit:

- Courses already assigned to an Instructor remain unchanged.
- A course assigned to any other role is unpublished and its instructor is
  cleared; log its document ID and title for Admin correction.
- Enrollments connected to non-students are removed because they violate the
  permission matrix; log the number removed.
- Do not silently choose a replacement Instructor.

The current local database already has Instructor owners for all courses, so the
audit should make no changes in the normal case.

## 3. Frontend authoring changes

- Extend course input validation with an `instructorId` for Admin and Content
  Manager creation/reassignment.
- On course create/edit pages, load the safe Instructor list on the server.
- Course form behavior:
  - Instructor: show their own name as read-only; do not submit an editable owner.
  - Admin/Content Manager: show a required Instructor selector containing only
    Instructor-role accounts.
  - Edit form defaults to the course's current Instructor.
- Pass the selected Instructor to the Server Action and Strapi API only for
  platform-wide content roles.
- Preserve existing ownership policies: an Instructor remains limited to their
  own courses, while Admin and Content Manager manage all courses.

No student selector is required in the Next.js application because students
enroll themselves. The filtered student picker applies to Strapi Content Manager
for administrative enrollment creation.

## 4. Verification and acceptance tests

### Strapi Content Manager

- Course Instructor picker lists Ingrid/Ivan and any other Instructor-role user,
  but not Admin, Content Manager, or Student users.
- Enrollment Student picker lists only Student-role users.
- Searching and pagination continue to work inside each filtered set.
- Existing selected valid relations load correctly on edit screens.
- Other relation pickers, such as course lessons and quizzes, are unchanged.

### Backend enforcement

- Directly assigning a Student, Admin, or Content Manager as course instructor is
  rejected.
- Directly enrolling an Admin, Content Manager, or Instructor is rejected.
- Instructor course creation assigns the authenticated user even if another ID
  is submitted.
- Admin/Content Manager course creation without an Instructor is rejected.
- Admin/Content Manager can create and reassign a course to a valid Instructor.
- Instructor cannot transfer ownership to another Instructor.
- Registration role restrictions and the existing RBAC suite remain green.

### Regression checks

- Build the Strapi backend and admin panel.
- Type-check and lint the Next.js frontend.
- Run `scripts/rbac-check.sh` directly against Strapi.
- Test the relation endpoint with more users than one page to prove filtering is
  applied before pagination.
- Verify seeded courses, enrollment progress, lesson access, quizzes, and public
  course counts remain unchanged.

## 5. Delivery order

1. Add the filtered Content Manager relation-query extension and its tests.
2. Tighten lifecycle/controller role invariants.
3. Add the safe Instructor-list endpoint.
4. Update the Next.js course form and Server Actions.
5. Add the startup reconciliation and run it against a copied local database.
6. Run builds, RBAC tests, and manual Content Manager acceptance checks.

Implementation is complete only when invalid roles are absent from the two
dropdowns **and** forged invalid relations are rejected by the backend.
