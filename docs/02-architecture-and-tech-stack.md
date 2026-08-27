# 02 — Architecture & Tech Stack

## 1. The stack, and why each piece

### Fixed by the spec (no choice)

| Layer | Technology | Host |
|-------|-----------|------|
| Frontend | **Next.js** | **Vercel** |
| Backend / CMS | **Strapi** | **Railway** |

### Chosen by us (defend each one on video)

| Concern | Choice | Why |
|---------|--------|-----|
| Strapi version | **Strapi 5 (latest)** | Current LTS line; Document Service API, native Draft & Publish `status` param which we use directly for the blog. Requires Node 18/20/22 — we have 22.14. |
| Backend language | **TypeScript** | Strapi 5 scaffolds TS by default; type-safe custom controllers/policies. |
| Database | **PostgreSQL (Railway plugin)** | Railway containers have an **ephemeral filesystem** — SQLite would be wiped on every redeploy, destroying all users/courses. Postgres is the only correct choice here. This is a great video talking point. |
| Next.js version | **Next.js 16, App Router** | Server Components let us keep the Strapi JWT on the server and never ship it to the browser. Server Actions give us mutations without hand-rolled API routes. |
| Frontend language | **TypeScript (strict)** | |
| Styling | **Tailwind CSS v4** | Fast, no context-switching, tiny output. |
| Components | **shadcn/ui** (Radix under the hood) | Accessible primitives (dialog, dropdown, tabs) you own as source — not an opaque dependency. Keyboard + screen-reader behaviour for free. |
| Icons | **lucide-react** | Ships with shadcn. |
| Forms | **react-hook-form + zod** | One zod schema validates on the client **and** inside the Server Action. |
| Toasts | **sonner** | |
| Session crypto | **jose** | Sign/verify our own session cookie in the Edge middleware runtime. |
| Charts (admin stats) | **recharts** | Only if time allows; plain stat cards are acceptable. |
| Tests | **Vitest** (unit: grading + progress math) + a **bash/curl RBAC leak suite** | The curl suite is the artifact that *proves* backend enforcement on video (V-3). |
| Lint/format | ESLint + Prettier | |
| Commits | **Conventional Commits** | Directly addresses C-7 (commit history is graded). |

### Explicitly NOT used (and why — you may be asked)

- **NextAuth / Auth.js** — adds an abstraction layer over an auth system (Strapi's) that
  already exists. You must explain your auth code line by line on video; a ~60-line
  hand-written session module you fully understand beats a config you half-understand.
- **Redux / Zustand** — App Router + Server Components means the server is the state
  store. Client state is local only (form state, dialog open/closed).
- **Strapi Users & Permissions "public role" writes** — never. All writes are authenticated.
- **SQLite in production** — see the ephemeral filesystem note above.

---

## 2. Repository layout (monorepo, one public repo)

```
lms-cps/
├── README.md                  # C-8: how to run locally + features completed
├── docs/                      # this folder
├── .github/workflows/ci.yml   # lint + typecheck + unit tests on push
├── backend/                   # Strapi 5  → deployed to Railway (root dir = backend)
│   ├── config/
│   │   ├── admin.ts
│   │   ├── database.ts        # Postgres via DATABASE_URL, SSL on
│   │   ├── middlewares.ts     # CORS allowlist for the Vercel origin
│   │   ├── plugins.ts
│   │   └── server.ts          # host 0.0.0.0, port from env
│   ├── src/
│   │   ├── api/
│   │   │   ├── course/        # content-type, controller, service, routes, policies
│   │   │   ├── lesson/
│   │   │   ├── enrollment/
│   │   │   ├── lesson-progress/
│   │   │   ├── quiz/
│   │   │   ├── question/
│   │   │   ├── quiz-attempt/
│   │   │   └── post/          # blog
│   │   ├── extensions/
│   │   │   └── users-permissions/   # custom register + role management routes
│   │   ├── policies/          # global reusable policies (is-admin, is-owner, ...)
│   │   ├── utils/             # ownership helpers, sanitizers
│   │   └── index.ts           # bootstrap(): idempotent role + permission seeding
│   └── package.json
└── frontend/                  # Next.js 16 → deployed to Vercel (root dir = frontend)
    ├── src/
    │   ├── app/
    │   │   ├── (marketing)/           # /, /courses, /blog, /blog/[slug]  — public
    │   │   ├── (auth)/                # /login, /register
    │   │   ├── (dashboard)/
    │   │   │   ├── layout.tsx         # shared shell: sidebar + role-aware nav
    │   │   │   ├── dashboard/         # role-routed landing
    │   │   │   ├── my-courses/        # student
    │   │   │   ├── learn/[courseId]/  # student lesson player
    │   │   │   ├── teach/             # instructor + content manager
    │   │   │   ├── blog-admin/        # content manager + admin
    │   │   │   └── admin/             # admin only
    │   │   ├── api/auth/[...]/route.ts  # login/register/logout — sets httpOnly cookie
    │   │   ├── layout.tsx
    │   │   ├── error.tsx / not-found.tsx
    │   ├── components/  ui/ (shadcn) + feature components
    │   ├── lib/
    │   │   ├── strapi.ts      # typed fetch wrapper (auth, tags, error normalisation)
    │   │   ├── session.ts     # jose sign/verify, cookie read/write
    │   │   ├── auth.ts        # requireUser(), requireRole() server guards
    │   │   ├── permissions.ts # single source of truth for the matrix (UI mirror)
    │   │   └── validation/    # zod schemas shared client+server
    │   ├── types/strapi.ts
    │   └── middleware.ts      # coarse route protection (UX layer only)
    └── package.json
```

**Why a monorepo:** the submission form asks for *one* repository link containing both.
Vercel and Railway both support a "root directory" setting, so a monorepo deploys cleanly
to two hosts. It also keeps the commit history telling one coherent story.

---

## 3. Request flow (the diagram to draw on video for V-2)

```
Browser
  │  (1) form submit → Server Action  (no fetch, no token in JS)
  ▼
Next.js Server (Vercel)
  │  (2) read httpOnly cookies: `lms_token` (Strapi JWT) + `lms_session` (signed role)
  │  (3) lib/strapi.ts attaches Authorization: Bearer <jwt>
  ▼
Strapi (Railway)
  │  (4) users-permissions middleware → resolves ctx.state.user + role
  │  (5) route-level permission (role can hit this endpoint at all?)
  │  (6) custom policy → record-level ownership check
  │  (7) controller → sanitises input, scopes the query, never trusts body ids
  ▼
PostgreSQL (Railway)
  │  (8) rows
  ▲
  │  (9) controller sanitises output (strip correct answers, strip drafts)
Next.js  (10) revalidateTag() invalidates only the affected cache tag
Browser  (11) re-rendered RSC payload streamed back
```

Key property: **the JWT never exists in browser JavaScript.** It lives in an httpOnly
cookie, is read only by the Next.js server, and is forwarded server-to-server. An XSS bug
therefore cannot steal a session token.

---

## 4. Environments

| Env | Frontend | Backend | DB |
|-----|----------|---------|-----|
| Local | `localhost:3000` | `localhost:1337` | Local Postgres (Docker) or SQLite for speed |
| Production | `<app>.vercel.app` | `<app>.up.railway.app` | Railway Postgres |

Local dev may use SQLite (fast, zero setup) **as long as** `config/database.ts` switches on
`DATABASE_CLIENT` so production is Postgres. Committing that switch is itself a talking
point for V-7.

---

## 5. The five enforcement layers (detail in doc 04)

1. **Next.js middleware** — redirect logged-out/wrong-role users. *UX only, not security.*
2. **Server Component / Server Action guards** — `requireRole()` throws before rendering
   or mutating. *UX + defence in depth.*
3. **Strapi route permissions** — can this role call this endpoint at all?
4. **Strapi custom policies** — does this *specific record* belong to this user?
5. **Strapi controllers/services** — query scoping + input/output sanitisation.

Layers 3–5 are the ones that satisfy F-1.4 ("enforce on the backend, not just by hiding
buttons"). Layers 1–2 exist so the app feels right, and you must say exactly this on video.
