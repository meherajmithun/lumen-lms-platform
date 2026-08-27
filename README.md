# LMS — Learning Management System

A four-role learning platform: students enroll in courses, work through ordered
lessons, mark them complete and take auto-graded quizzes; instructors and content
managers build the material; admins manage people and roles.

| | |
|---|---|
| **Frontend** | Next.js 16 (App Router, TypeScript) · Tailwind v4 · shadcn/ui → Vercel |
| **Backend** | Strapi 5 (TypeScript) + PostgreSQL → Railway |
| **Local database** | SQLite — no install needed |

---

## Run it locally

**You need:** Node 20 or 22 (`node -v` to check), and npm. Nothing else — no
database to install, no accounts to create, no Strapi or Vercel sign-up.

### 1. Install

```bash
git clone <this-repo-url> lms-cps
cd lms-cps

cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

> If npm asks you to approve install scripts, run
> `npm approve-scripts better-sqlite3 esbuild core-js-pure @swc/core` inside
> `backend/`. Strapi needs those to build.

### 2. Create the two settings files

**`backend/.env`** — generate fresh secrets first:

```bash
cd backend
cp .env.example .env
node -e '
const c=require("crypto"), one=()=>c.randomBytes(32).toString("base64");
console.log("APP_KEYS="+Array.from({length:4},()=>c.randomBytes(16).toString("base64")).join(","));
for (const k of ["API_TOKEN_SALT","ADMIN_JWT_SECRET","TRANSFER_TOKEN_SALT","JWT_SECRET","ENCRYPTION_KEY"])
  console.log(k+"="+one());
'
```

Paste those six lines into `backend/.env`, replacing the blank ones. Leave the
rest of the file as it is — it already points at SQLite.

**`frontend/.env.local`**:

```bash
cd ../frontend
cp .env.example .env.local
node -e 'console.log("SESSION_SECRET="+require("crypto").randomBytes(32).toString("base64"))'
```

Paste that line into `frontend/.env.local`.

### 3. Start both, in two terminals

```bash
# terminal 1 — backend, http://localhost:1337
cd backend && npm run develop
```

```bash
# terminal 2 — frontend, http://localhost:3000
cd frontend && npm run dev
```

**Start the backend first.** On its first boot it creates the database, the four
roles, all their permissions, and a set of demo users and courses. Watch for these
lines:

```
[bootstrap] created role "Admin" (admin)
[seed] created user admin@lms.test (admin)
[seed] demo data reconciled (login password: Passw0rd!)
Strapi started successfully
```

### 4. Sign in

Open **http://localhost:3000** and sign in. Every demo account uses the password
`Passw0rd!`:

| Email | Role | What they can do |
|---|---|---|
| `admin@lms.test` | Admin | Everything, plus managing people's roles |
| `cm@lms.test` | Content Manager | All courses and the blog; **not** people |
| `instructor.a@lms.test` | Instructor | Only **their own** courses |
| `instructor.b@lms.test` | Instructor | A second one, to test ownership |
| `student1@lms.test` | Student | Enroll, learn, take quizzes |
| `student2@lms.test` | Student | Has a course at 100% |
| `student3@lms.test` | Student | Fresh, nothing started |

There is no seeded account for Strapi's own admin panel (`localhost:1337/admin`).
The first person to open that URL creates it — it is a **separate** login from the
app's Admin role.

**Next:** [`docs/EXPLORING-THE-PROJECT.md`](docs/EXPLORING-THE-PROJECT.md) walks
you through what to click, in what order, and what each screen is proving.

---

## Roles and permissions

| Action | Admin | Content Manager | Instructor | Student |
|---|:-:|:-:|:-:|:-:|
| Manage users & assign roles | ✅ | ❌ | ❌ | ❌ |
| Create / edit / delete any course | ✅ | ✅ | Own only | ❌ |
| Add / edit / delete lessons | ✅ | ✅ | Own courses | ❌ |
| Create quizzes | ✅ | ✅ | Own courses | ❌ |
| View student progress | ✅ | ✅ | Own courses | Own only |
| Write / manage blog posts | ✅ | ✅ | ❌ | ❌ |
| Enroll in a course | ❌ | ❌ | ❌ | ✅ |
| Take quizzes | ❌ | ❌ | ❌ | ✅ |

Enforced in five layers, three of which are on the server:

1. `frontend/src/proxy.ts` — redirects by role. Routing only, not security.
2. `requireRole()` in every page **and** every Server Action.
3. Strapi **route permissions** — can this role call this endpoint at all.
4. Strapi **policies** — does this specific record belong to this user.
5. Strapi **controllers** — query scoping and input/output sanitisation.

Delete the entire frontend and hit Strapi with curl: every rule above still holds.
Prove it yourself:

```bash
cd backend && npm run develop        # in another terminal
bash scripts/rbac-check.sh http://localhost:1337
# → 36 passed, 0 failed
```

Pure grading and progress calculations also have an executable unit suite:

```bash
cd backend && npm test
# → 2 test files, 11 tests passed
```

---

## Features

| Requirement | Where |
|---|---|
| Auth + 4 roles | `backend/src/constants/roles.ts`, `frontend/src/lib/auth.ts` |
| Backend-enforced RBAC | `backend/src/policies/`, `backend/src/config/permissions-map.ts` |
| Course management | `frontend/src/app/(dashboard)/teach/` |
| Lessons (text or video) | `backend/src/api/lesson/`, `frontend/src/components/lms/lesson-player.tsx` |
| Enrollment + My Courses | `backend/src/api/enrollment/controllers/enrollment.ts` |
| Sequential lesson viewing | `frontend/src/components/lms/lesson-player.tsx` |
| Progress tracking | `backend/src/api/lesson/services/lesson.ts` (idempotent) |
| Daily learning consistency | `backend/src/api/learning-session/`, `frontend/src/components/lms/learning-consistency-chart.tsx` |
| Quiz auto-grading | `backend/src/api/quiz/services/quiz.ts` (server-side only) |
| Admin panel + stats | `frontend/src/app/(dashboard)/admin/` |
| Blog draft → publish | `backend/src/api/post/controllers/post.ts` |

---

## Project layout

```
backend/                    Strapi 5
  src/api/                  8 content types, each with routes + policies + controller
  src/policies/             role and record-level ownership checks
  src/config/permissions-map.ts   the permission matrix, as code
  src/bootstrap/            roles, permissions and demo data, applied on every boot
frontend/                   Next.js 16
  src/app/(marketing)/      public: home, courses, blog
  src/app/(auth)/           sign in, register
  src/app/(dashboard)/      signed-in: learn, teach, blog-admin, admin
  src/lib/                  strapi client, session, auth guards, permission mirror
  src/components/lms/       feature components
docs/                       plan, architecture, decisions, setup guides
scripts/rbac-check.sh       proves permissions hold with no frontend involved
```

## Documentation

- [`docs/EXPLORING-THE-PROJECT.md`](docs/EXPLORING-THE-PROJECT.md) — **start here after running it**
- [`docs/README.md`](docs/README.md) — index of the full plan
- [`docs/04-rbac-and-security.md`](docs/04-rbac-and-security.md) — how permissions are enforced
- [`docs/13-decisions-and-risks.md`](docs/13-decisions-and-risks.md) — why each choice was made
- [`docs/SETUP-GUIDE-FOR-BEGINNERS.md`](docs/SETUP-GUIDE-FOR-BEGINNERS.md) — deploying to Railway and Vercel

## Troubleshooting

| Problem | Fix |
|---|---|
| `unable to open database file` | `mkdir -p backend/.tmp`, and check `DATABASE_FILENAME` is not blank |
| Everything returns 403 | Backend not running, or `.env` secrets are blank |
| `Another next dev server is already running` | `pkill -f "next dev"` |
| Port 1337 in use | `lsof -ti:1337 \| xargs kill -9` |
| Want a clean slate | Stop Strapi, `rm backend/.tmp/data.db`, restart — roles and demo data rebuild |
