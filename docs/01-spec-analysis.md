# 01 — Spec Analysis (every requirement, extracted)

Every line of the PDF is turned into a numbered requirement below. Nothing is dropped.
These IDs are referenced by the roadmap (doc 09) and the checklist (`CHECKLIST.md`).

---

## A. Constraints (violating any of these voids the submission)

| ID | Requirement | Source |
|----|-------------|--------|
| C-1 | Frontend **must** be Next.js, hosted on **Vercel** | "Tech Stack (mandatory — no deviations)" |
| C-2 | Backend/CMS **must** be Strapi, hosted on **Railway** | same |
| C-3 | Any other framework or hosting ⇒ submission is **void** | same |
| C-4 | Deadline 30 Aug 2026 11:59 PM; late submissions not accepted | "Deadline" |
| C-5 | Deployed app must stay live until interviews are over | "Important Rules" |
| C-6 | Repo must be **public** and contain **both** frontend + backend | "Submission" |
| C-7 | Repo must have proper commit history; single-commit push is a **negative signal** | "Important Rules" |
| C-8 | README must state: how to run locally + which features were completed | "Important Rules" |
| C-9 | Project must not be fully AI-generated; your own thinking must be visible | "On Using AI" |

---

## B. Roles

| ID | Role | Definition from the PDF |
|----|------|--------------------------|
| R-1 | **Admin** | Full control of the platform. Manages users and assigns/changes their roles. Can do everything. |
| R-2 | **Content Manager** | Creates and manages courses and lessons (the content library). **Does not manage users.** |
| R-3 | **Instructor** | Manages the lessons and quizzes of **their own** courses, and can see the progress of students enrolled in them. |
| R-4 | **Student** | Enrolls in courses, views lessons, takes quizzes, tracks **their own** progress. |
| R-5 | Access must differ **strictly** by role. A logged-in user must only be able to do what their role allows — nothing more. |

---

## C. Permission Matrix (verbatim from the PDF)

| Action | Admin | Content Manager | Instructor | Student |
|--------|:-----:|:---------------:|:----------:|:-------:|
| P-1 Manage users & assign roles | ✅ | ❌ | ❌ | ❌ |
| P-2 Create / edit / delete any course | ✅ | ✅ | **Own only** | ❌ |
| P-3 Add / edit / delete lessons | ✅ | ✅ | **Own courses** | ❌ |
| P-4 Create quizzes | ✅ | ✅ | **Own courses** | ❌ |
| P-5 View student progress | ✅ | ✅ | **Own courses** | **Own only** |
| P-6 Write / manage blog posts | ✅ | ✅ | ❌ | ❌ |
| P-7 Enroll in a course | ❌ | ❌ | ❌ | ✅ |
| P-8 Take quizzes | ❌ | ❌ | ❌ | ✅ |

> "Getting this 4-role access control right — cleanly, without leaks — is itself part of
> what we're evaluating."

**Read the matrix carefully — three subtleties most candidates miss:**

1. **P-7 / P-8 are ❌ for Admin.** Admin "can do everything" *administratively*, but the
   matrix says Admin cannot enroll or take quizzes. We follow the **matrix** (it is the
   normative table) and treat "can do everything" as management scope. This is a
   deliberate, defensible reading — it is written down in
   [`13-decisions-and-risks.md`](./13-decisions-and-risks.md) as **ADR-009** so you can
   explain it on video.
2. **Instructor cannot create courses platform-wide** — "Own only". So an Instructor
   *can* create a course (it becomes theirs) and edit/delete only courses they own.
   Instructors may **not** touch another instructor's course.
3. **Content Manager has ❌ on user management but ✅ on everything content.** Never let a
   Content Manager reach `/api/users` write routes.

---

## D. Core Features (must be present)

| ID | Requirement |
|----|-------------|
| F-1.1 | Sign up / Login, with a role for each user (admin / content manager / instructor / student) |
| F-1.2 | Role-based protected routes — logged-out user or wrong-role user must not access a restricted page |
| F-1.3 | …or perform a restricted **action** |
| F-1.4 | **Enforce on the backend, not just by hiding buttons** |
| F-2.1 | Courses created / edited / deleted per the permission matrix (CM platform-wide, Instructor own) |
| F-2.2 | Under each course, multiple lessons can be added / edited / deleted |
| F-2.3 | Lesson = title + content; content can be **text or a video URL** |
| F-3.1 | Student can browse available courses and enroll |
| F-3.2 | Enrolled courses show up separately under **"My Courses"** |
| F-4.1 | Student can view the lessons of enrolled courses **in sequence** |

---

## E. Differentiator Features (where the grading separates candidates)

> "Most candidates can deliver the core features. The real differentiation happens on
> these features — do them well, **with edge cases handled**, and you'll be ahead."

### E-1 Progress Tracking
| ID | Requirement |
|----|-------------|
| D-1.1 | Student can mark a lesson "complete" when finished |
| D-1.2 | For each course, show the student's progress percentage (3 of 5 = 60%) |
| D-1.3 | Progress must be accurate **per student, per course** |
| D-1.4 | Progress must **persist across refreshes** (i.e. server-stored, not client state) |

### E-2 Quiz with Auto-Grading
| ID | Requirement |
|----|-------------|
| D-2.1 | Instructor / Content Manager can add an MCQ quiz to a course (question + options + correct answer) |
| D-2.2 | Student takes the quiz and gets an **automatic score immediately on submit** |
| D-2.3 | The student's quiz result is **stored and viewable later** |

### E-3 Admin Panel
| ID | Requirement |
|----|-------------|
| D-3.1 | A dedicated admin dashboard, accessible **only** to the admin role |
| D-3.2 | Admin can see all users and manage their roles (promote / change / remove a user's role) |
| D-3.3 | Admin can view and manage **all** courses, lessons, and blog posts across the platform |
| D-3.4 | Show basic platform stats (total users per role, total courses, total enrollments) |

### E-4 Blog — Writing & Control
| ID | Requirement |
|----|-------------|
| D-4.1 | Content Manager (and Admin) can write, edit, publish, delete blog posts (title + body; cover image URL is fine) |
| D-4.2 | **Draft vs Published** state — only published posts visible to students/public; drafts are not |
| D-4.3 | **Anyone** (incl. logged out) can read the published blog list and open a single post |
| D-4.4 | Admin has full control over **every** blog post including others' |
| D-4.5 | Content Manager manages the posts they can create per the matrix |

---

## F. Video Walkthrough (mandatory, ≤10 minutes)

Screen recording, **your own voice**. Must cover **all seven** of:

| ID | Segment |
|----|---------|
| V-1 | Live demo on the **deployed** app across roles: student (enroll → lesson → progress → quiz), instructor/CM (create course → lesson → quiz → blog post), admin (admin panel → manage a user's role) |
| V-2 | Data flow — pick one feature, show data moving frontend → Strapi → back |
| V-3 | Role-based access — show how you enforce permissions **on the backend** |
| V-4 | Progress tracking logic — how implemented, where/how stored, **explained line by line** |
| V-5 | Quiz auto-grading logic — how the score is computed, **shown in code** |
| V-6 | Admin panel + blog — admin managing roles, and the draft → publish flow |
| V-7 | Deployment setup — how you configured Vercel and Railway, and how you handled env vars |

⚠ "If you can't explain your own code, you're out."

---

## G. Submission (all four or it's incomplete)

| ID | Item |
|----|------|
| S-1 | GitHub repository link (public — both frontend + backend) |
| S-2 | Frontend URL — live Vercel link |
| S-3 | Backend URL — live Railway link |
| S-4 | Video walkthrough link (Google Drive / YouTube unlisted — must be openable) |

---

## H. Gaps the spec leaves open (our decisions, all logged in doc 13)

| Open question | Our decision |
|---------------|--------------|
| How does a user get a non-Student role at signup? | Signup offers **Student** or **Instructor** only. Admin & Content Manager are assignable **only by an Admin** via the admin panel. Prevents privilege escalation at registration. (ADR-004) |
| One repo or two? | **One monorepo** — the form asks for one repository link that contains both. (ADR-001) |
| Where do quiz answers live? | Server only. Student-facing quiz API strips `isCorrect`. (ADR-006) |
| Is a quiz per course or per lesson? | Per **course** — the PDF says "add an MCQ quiz to a course". (ADR-007) |
| Cover image: upload or URL? | URL string (the PDF explicitly allows it). Cloudinary upload is an optional stretch. (ADR-008) |
| Can Admin enroll/take quizzes? | No — the matrix says ❌. (ADR-009) |
| Can an Instructor see another instructor's students? | No — "own courses" only. (ADR-010) |
