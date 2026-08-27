# 03 — Data Model (Strapi content types)

## 1. Entity-relationship overview

```
              ┌──────────────────┐
              │ users-permissions│
              │      .user       │──────┐
              └────────┬─────────┘      │ author
                       │                ▼
        ┌──────────────┼───────────┐  ┌──────┐
        │ instructor   │ student   │  │ post │ (blog, Draft&Publish)
        ▼              ▼           ▼  └──────┘
   ┌─────────┐   ┌────────────┐  ┌─────────────────┐
   │ course  │◄──│ enrollment │  │ lesson-progress │
   └────┬────┘   └────────────┘  └────────┬────────┘
        │ 1:n                             │ n:1
        ├──────────► lesson ◄──────────────┘
        │ 1:n
        └──────────► quiz ──1:n──► question ──(options JSON)
                       ▲
                       │ n:1
                  quiz-attempt ──n:1──► user
```

**Relation cardinality summary**

| From | To | Type |
|------|-----|------|
| course → instructor (user) | manyToOne | every course has exactly one owner |
| course → lessons | oneToMany | ordered by `order` |
| course → quizzes | oneToMany (practically 1) | |
| quiz → questions | oneToMany | |
| enrollment → student (user), course | manyToOne each | unique pair |
| lesson-progress → student (user), lesson, course | manyToOne each | unique (student, lesson) |
| quiz-attempt → student (user), quiz | manyToOne each | many attempts allowed, latest wins for display |
| post → author (user) | manyToOne | |

---

## 2. Content types in detail

> Strapi 5 note: every entry automatically has `documentId`, `createdAt`, `updatedAt`,
> `publishedAt`, `locale`. We add `createdBy`/`updatedBy` implicitly via admin, but for
> end-user ownership we use **explicit relation fields** (`instructor`, `student`,
> `author`) because `createdBy` only tracks *admin-panel* users, not users-permissions
> users. **This distinction trips up most candidates — mention it on video.**

### 2.1 `course` (collection type, API ID `api::course.course`)

| Field | Type | Rules |
|-------|------|-------|
| `title` | String | required, min 3, max 120 |
| `slug` | UID (from `title`) | required, unique — used for pretty URLs |
| `description` | Text (long) | optional, max 2000 |
| `coverImageUrl` | String | optional, must be a URL (validated in the app layer) |
| `level` | Enumeration | `beginner` \| `intermediate` \| `advanced`, default `beginner` |
| `isPublished` | Boolean | default `false` — controls student visibility |
| `instructor` | Relation manyToOne → `plugin::users-permissions.user` | **required**, set server-side from JWT, never from the request body |
| `lessons` | Relation oneToMany → `lesson` | |
| `quizzes` | Relation oneToMany → `quiz` | |
| `enrollments` | Relation oneToMany → `enrollment` | |

Draft & Publish: **disabled** for course; we use the explicit `isPublished` boolean so
Content Managers/Instructors can stage a course without Strapi's draft machinery
interfering with our ownership filters.

### 2.2 `lesson`

| Field | Type | Rules |
|-------|------|-------|
| `title` | String | required, max 160 |
| `contentType` | Enumeration | `text` \| `video` — required (satisfies F-2.3) |
| `body` | Rich text / Text | required when `contentType = text` |
| `videoUrl` | String | required when `contentType = video`; validated as a URL |
| `order` | Integer | required, default 0 — **drives "view lessons in sequence" (F-4.1)** |
| `durationMinutes` | Integer | optional, for nicer UI |
| `course` | Relation manyToOne → `course` | required |
| `progresses` | Relation oneToMany → `lesson-progress` | |

Validation of the `contentType` ↔ `body`/`videoUrl` pairing happens in a **lifecycle hook**
(`beforeCreate` / `beforeUpdate`) so it cannot be bypassed by hitting the API directly.

### 2.3 `enrollment`

| Field | Type | Rules |
|-------|------|-------|
| `student` | Relation manyToOne → user | required, from JWT only |
| `course` | Relation manyToOne → course | required |
| `enrolledAt` | DateTime | default now |
| `status` | Enumeration | `active` \| `completed`, default `active` |

**Uniqueness:** (student, course) must be unique. Strapi has no composite unique index in
the schema DSL, so enforce it in **both**:
- the custom controller (`findOne` existing enrollment → 409 if present), and
- a `beforeCreate` lifecycle hook (defence in depth against direct API use).

### 2.4 `lesson-progress`

| Field | Type | Rules |
|-------|------|-------|
| `student` | Relation manyToOne → user | required, from JWT only |
| `lesson` | Relation manyToOne → lesson | required |
| `course` | Relation manyToOne → course | required — denormalised so course progress is one query, not a join walk |
| `completedAt` | DateTime | required |

**Uniqueness:** (student, lesson). Enforced by an upsert-style controller: find-or-create.
Marking complete twice must be idempotent, never a duplicate row — this is exactly the
"edge case handled" the spec rewards (D-1.3).

Why denormalise `course`? Computing "3 of 5 lessons done" for a course becomes:
`count(lesson-progress where student=me and course=X) / count(lesson where course=X)` —
two cheap counts. Say this on video for V-4.

### 2.5 `quiz`

| Field | Type | Rules |
|-------|------|-------|
| `title` | String | required |
| `description` | Text | optional |
| `passingScore` | Integer | default 60, 0–100 |
| `course` | Relation manyToOne → course | required |
| `questions` | Relation oneToMany → question | |
| `attempts` | Relation oneToMany → quiz-attempt | |

### 2.6 `question`

| Field | Type | Rules |
|-------|------|-------|
| `prompt` | Text | required |
| `options` | JSON | array of `{ id: string, text: string }`, min 2 items |
| `correctOptionId` | String | required — **must never reach a student's browser** |
| `order` | Integer | default 0 |
| `quiz` | Relation manyToOne → quiz | required |

> Alternative modelling (a `component` with a repeatable option + `isCorrect` boolean) is
> also valid. We use a JSON `options` array + a `correctOptionId` scalar because it makes
> the sanitisation rule trivially auditable: *"strip exactly one field, `correctOptionId`,
> on every student-facing read."* One field is easy to prove correct; a boolean scattered
> across a component array is easy to leak by forgetting a `populate`.

### 2.7 `quiz-attempt`

| Field | Type | Rules |
|-------|------|-------|
| `student` | Relation manyToOne → user | required, from JWT only |
| `quiz` | Relation manyToOne → quiz | required |
| `answers` | JSON | `[{ questionId, selectedOptionId, correct: boolean }]` — written by the server after grading |
| `score` | Integer | 0–100, computed server-side |
| `correctCount` | Integer | |
| `totalQuestions` | Integer | |
| `passed` | Boolean | `score >= quiz.passingScore` |
| `submittedAt` | DateTime | |

`score`, `correctCount`, `passed` are **never accepted from the request body.** If the
client sends them, they are discarded. Demonstrate this with a curl call on video (V-5).

### 2.8 `post` (blog)

| Field | Type | Rules |
|-------|------|-------|
| `title` | String | required, max 160 |
| `slug` | UID from title | required, unique |
| `excerpt` | Text | optional, max 300 |
| `body` | Rich text | required |
| `coverImageUrl` | String | optional (PDF: "a cover image URL is fine") |
| `author` | Relation manyToOne → user | required, from JWT |

**Draft & Publish: ENABLED.** This is the one content type where we use Strapi's native
draft system, because D-4.2 maps to it exactly. In Strapi 5:
- `GET /api/posts` returns **published** entries by default,
- `GET /api/posts?status=draft` returns drafts and requires an authenticated privileged role,
- `POST /api/posts/:documentId/actions/publish` (Document Service `publish()`) flips state.

Our custom controller **hard-forces `status: 'published'`** for unauthenticated and
Student callers, so a crafted `?status=draft` query from the public can never leak a draft.
That forcing line is the single most important line for D-4.2 — show it on video.

---

## 3. Roles (users-permissions)

Four roles created by the bootstrap seed, with these exact `type` slugs:

| Role name | `type` | Description |
|-----------|--------|-------------|
| Admin | `admin` | Full platform control |
| Content Manager | `content_manager` | Content library + blog |
| Instructor | `instructor` | Own courses, lessons, quizzes, student progress |
| Student | `student` | Enroll, learn, quiz, own progress |

> ⚠️ Do **not** confuse these with Strapi's **admin panel** roles (Super Admin / Editor /
> Author). Those govern who can log into `/admin`. Ours govern the API for end users. Two
> completely separate tables. Explain this in the video — it demonstrates real
> understanding of Strapi.

The default `Authenticated` role stays but gets **zero** permissions, so a user who somehow
lands in it can do nothing. `Public` gets only: read published posts, read published courses
(list/detail metadata), auth endpoints.

---

## 4. Derived values (computed, never stored)

| Value | Formula | Where computed |
|-------|---------|----------------|
| Course progress % | `round(completedLessons / totalLessons * 100)`, `0` if `totalLessons = 0` | Strapi service `course.getProgressFor(userId, courseId)` |
| Quiz score % | `round(correctCount / totalQuestions * 100)` | Strapi service `quiz.grade()` |
| Platform stats | counts per role / courses / enrollments | Strapi custom route `GET /api/admin/stats` |

**Division-by-zero is a real edge case here**: a course with zero lessons must show 0%, not
`NaN%`. Handle it and mention it — the spec explicitly rewards handled edge cases.

---

## 5. Seed data (for the demo and the video)

The bootstrap seed creates, only if the DB is empty:

- 1 Admin, 1 Content Manager, 2 Instructors, 3 Students (known passwords, in `.env`)
- 4 courses (2 owned by each instructor), 4–6 lessons each, 1 quiz with 5 questions each
- 3 blog posts: 2 published, 1 **draft** (so you can demo D-4.2 live)
- A couple of enrollments and partial progress, so the progress bar is not 0% on camera

A pre-seeded demo makes the 10-minute video achievable. Without it you'll burn 4 minutes
typing forms.
