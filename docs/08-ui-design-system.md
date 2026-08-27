# 08 — UI Design System & Screen Specs

## 0. On the "frontend-design skill"

You asked to use frontend-design skills when building the UI. A note on what's actually
installed on this machine, so the plan is honest:

| Skill | Installed? | Use it for |
|-------|-----------|-----------|
| `frontend-design` | ⚠️ **available but not installed** — install with `/plugin install frontend-design@claude-plugins-official` | Aesthetic direction, typography, and avoiding templated/generic-AI-looking UI. **Load it before building any screen.** |
| `design` | ✅ | Multi-artboard visual mockups on a pan/zoom canvas — good for laying out the dashboard, lesson player and admin screens **before** coding them |
| `web-quality-audit` | ✅ | Lighthouse-style pass on the deployed site (performance, a11y, SEO) — run it on Day 5 |
| `dataviz` | ✅ | The admin stats charts — load it **before** writing any chart code |
| `artifact-design` / `artifact-diagramming` | ✅ | If you want a shareable architecture diagram for the video |

**Install `frontend-design` first** (one command, then restart Claude Code):
```
/plugin install frontend-design@claude-plugins-official
```
It ships in Anthropic's official marketplace, which is already registered on this machine —
the plugin just was never installed. It is the right skill for this job: it pushes for a
deliberate visual identity instead of the default shadcn-template look, which matters here
because the reviewers see the same LMS spec from every candidate.

**Recommended usage during the build:**
1. **Before any UI work** → load `frontend-design` for the aesthetic direction (palette,
   type pairing, layout point of view), then `/design` to mock the 4 key screens (student
   dashboard, lesson player, admin users table, blog editor). Fast, and it stops you
   redesigning in code.
2. **When building `/admin` stats** → invoke `/dataviz` first.
3. **On Day 5** → invoke `/web-quality-audit` against the Vercel URL and fix what it finds.

Location on disk (already downloaded, just not activated):
`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/`

---

## 1. Design direction

**Positioning:** a calm, credible learning product. Content-forward, generous whitespace,
restrained colour. Not a dashboard-template look; not a neon SaaS landing page.

**Principles**
1. **Content first** — lesson text and video are the largest, highest-contrast thing on screen.
2. **Progress is always visible** — the student should never wonder where they are.
3. **Role clarity** — the shell tells you what you are (badge + tailored nav) without shouting.
4. **Boring is good for destructive actions** — confirm dialogs, plain language.

---

## 2. Tokens

```css
/* globals.css — Tailwind v4 @theme */
@theme {
  --color-brand-50:  oklch(0.97 0.02 250);
  --color-brand-500: oklch(0.62 0.17 255);   /* primary actions */
  --color-brand-600: oklch(0.55 0.18 255);   /* hover */
  --color-success:   oklch(0.68 0.16 150);   /* completed, passed */
  --color-warning:   oklch(0.78 0.15  75);   /* draft badge */
  --color-danger:    oklch(0.60 0.20  25);   /* destructive, failed */

  --font-sans: "Inter", ui-sans-serif, system-ui;
  --radius: 0.625rem;
}
```
Dark mode via shadcn's `.dark` class + a `next-themes` toggle. Define **every** colour as a
token in both themes; never hardcode a hex in a component.

**Type scale:** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 px. Body 16px, lesson body 18px with
`max-w-[68ch]` and `leading-relaxed`.

**Spacing:** 4px base. Page gutter 16px mobile / 24px tablet / 32px desktop. Section rhythm
`space-y-8`.

**Role colours** (used only in the role badge and admin table, never as the sole signal):
Admin = rose, Content Manager = violet, Instructor = amber, Student = sky. Always pair the
colour with the role *word* — colour alone fails accessibility.

---

## 3. Layout shells

**Public shell** — sticky header (logo, Courses, Blog, theme toggle, Login/Sign up),
centered `max-w-7xl` content, simple footer.

**Dashboard shell** — left sidebar 240px (collapses to a `Sheet` below `md`), top bar with
breadcrumbs + user menu (name, role badge, theme toggle, Log out).

Sidebar navigation **by role** — this is the visible expression of the matrix:

| | Admin | Content Manager | Instructor | Student |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Users | ✅ | | | |
| All Courses | ✅ | ✅ | | |
| My Courses (teaching) | ✅ | ✅ | ✅ | |
| Blog | ✅ | ✅ | | |
| Platform Stats | ✅ | | | |
| My Courses (learning) | | | | ✅ |
| Browse Courses | | | | ✅ |
| My Results | | | | ✅ |

---

## 4. Screen-by-screen spec

### 4.1 Landing `/`
Hero (headline, subline, "Browse courses" + "Sign up"), 3-up value props, featured courses
grid (6), latest blog posts (3), footer. Server-rendered, ISR.

### 4.2 Courses `/courses` (public)
Filter bar (search, level, sort). Responsive grid 1/2/3 cols. **Course card:** cover image
16:9, level badge, title (2-line clamp), instructor name + avatar, lesson count, and either
"Enroll" (student), "Continue" (enrolled), or "View" (other roles). Empty state with an
illustration + "No courses match your filters".

### 4.3 Course detail `/courses/[slug]`
Two columns on desktop: left = description + syllabus (lesson list, locked until enrolled),
right = a sticky enroll card (cover, level, lesson count, quiz count, CTA). Logged-out CTA →
`/login?next=/courses/[slug]`.

### 4.4 My Courses `/my-courses` (student, F-3.2)
Grid of enrolled-course cards, each with a **progress bar + "3 of 5 lessons · 60%"** and a
"Continue" button that deep-links to the first incomplete lesson. Tabs: In progress /
Completed. Empty state → "You haven't enrolled yet" + link to `/courses`.

### 4.5 Lesson player `/learn/[slug]/lessons/[id]` — the most important screen
```
┌──────────────────────────────────────────────────────────────┐
│ ← Course title                            Progress ███░░ 60% │
├───────────────┬──────────────────────────────────────────────┤
│ OUTLINE       │  Lesson 3 · Components                       │
│ ✓ 1 Intro     │  ┌────────────────────────────────────────┐  │
│ ✓ 2 Setup     │  │  video embed  OR  prose (max-w 68ch)   │  │
│ ▸ 3 Comps     │  └────────────────────────────────────────┘  │
│   4 State     │  [ ✓ Mark as complete ]                      │
│   5 Deploy    │  ← Previous            Next lesson →         │
│ ─────────     │                                              │
│ 🧠 Take quiz  │                                              │
└───────────────┴──────────────────────────────────────────────┘
```
- Outline collapses into a `Sheet` on mobile.
- `contentType === 'video'` → responsive 16:9 iframe (YouTube/Vimeo embed URL normalised);
  `text` → typographic prose block.
- "Mark as complete" is **optimistic**: tick + progress bar move instantly, revert with a
  toast on failure.
- After the last lesson, the Next button becomes "Take the quiz".

### 4.6 Quiz `/learn/[slug]/quiz/[id]`
One card per question: prompt, radio options (whole row clickable, large hit target),
"Question 3 of 5" indicator, sticky footer with answered count + Submit. Submit opens a
confirm dialog if anything is unanswered. **Results view:** big score ring, pass/fail badge,
then a per-question list with ✓/✗, the option you chose, and the correct one (revealed only
*after* grading, from the server response). "Retake" + "Back to course".

### 4.7 Results `/results`
Table: quiz, course, score, pass/fail, date. Empty state.

### 4.8 Teach `/teach` (instructor + CM)
Course table: title, lessons, enrolled students, published toggle, actions. Instructors see
only their own (enforced server-side); CM sees all. "New course" button.

### 4.9 Course editor `/teach/courses/[id]`
Tabs: **Details** | **Lessons** | **Quiz** | **Students**.
- *Lessons*: sortable list (drag or ▲▼ buttons writing `order`), inline add/edit dialog with
  a `contentType` toggle switching between a textarea and a video-URL input.
- *Quiz*: question builder — prompt, 2–6 options with an "add option" control, a radio to
  mark the correct one, per-question delete. Save writes all questions in one action.
- *Students*: roster with each student's progress % and last activity (P-5).

### 4.10 Blog admin `/blog-admin`
Tabs Drafts / Published. Table with a **status badge** (amber Draft / green Published),
author, updated date, and a Publish/Unpublish button. Editor page: title, auto-slug,
excerpt, cover image URL (with a live preview thumbnail), body, and a footer with
Save draft / Publish / Delete.

### 4.11 Admin dashboard `/admin`
Stat cards row: Total Users, Courses, Lessons, Enrollments, Posts. Below: a users-by-role
bar chart (load `/dataviz` first) and a "Recent activity" list. All cards link to their
management page.

### 4.12 Admin users `/admin/users`
Table: avatar + name, email, **role badge**, joined date, actions. Role change = a `Select`
that opens an `AlertDialog` confirming the change. Your own row's control is disabled with a
tooltip ("You can't change your own role"). The last admin's control is disabled too.
Search + pagination.

### 4.13 Auth pages
Centered card, max-w 400px. Register: name, email, password (with a strength hint), and a
**role selector limited to Student / Instructor** with a helper line: *"Content Manager and
Admin roles are assigned by an administrator."* That single line demonstrates you thought
about privilege escalation — a nice thing to point at on video.

### 4.14 403 page
Friendly, not scary: "You don't have access to this page", the user's current role, and a
link back to their dashboard.

---

## 5. Reusable components to build

`CourseCard`, `ProgressBar` (with `aria-valuenow`), `LessonListItem`, `RoleBadge`,
`StatCard`, `EmptyState`, `ConfirmDialog`, `PageHeader`, `DataTable`, `FormField`,
`VideoEmbed` (URL normaliser + 16:9 wrapper), `RichText`, `SubmitButton` (pending state
built in).

---

## 6. States every screen must handle

| State | Treatment |
|-------|-----------|
| Loading | Skeletons matching the final layout (never a bare spinner) |
| Empty | Icon + one-line explanation + primary action |
| Error | `error.tsx` with a "Try again" reset button |
| Forbidden | `/403` page, not a blank screen |
| Not found | `not-found.tsx` |
| Offline / server down | Toast: "Couldn't reach the server. Retry." |

---

## 7. Accessibility acceptance criteria

- Full keyboard walkthrough of enroll → lesson → mark complete → quiz → submit
- Focus visible on every interactive element; focus trapped in dialogs and restored on close
- Progress announced via `aria-live="polite"` when it changes
- Quiz radios in a proper `<fieldset>` with a `<legend>` per question
- Icon-only buttons have `aria-label`
- Contrast ≥ 4.5:1 in **both** themes
- Respects `prefers-reduced-motion`

---

## 8. Motion

Keep it minimal: 150ms ease-out on hover/press, 200ms fade+slide on dialogs, a 400ms
animated width transition on the progress bar (so completing a lesson *feels* like progress).
Nothing else.
