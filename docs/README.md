# LMS — Project Round Documentation

This folder is the single source of truth for building the LMS required by
`Junior Software Engineer — Project Round.pdf`.

**Read the docs in this order.** Each one is self-contained and chunked so you can
work through it in a sitting.

| # | Doc | What it answers |
|---|-----|-----------------|
| 🧭 | [`EXPLORING-THE-PROJECT.md`](./EXPLORING-THE-PROJECT.md) | **Run it, then read this.** A guided tour of every role and screen, what each one proves, and which file to open next. |
| 🚀 | [`SETUP-GUIDE-FOR-BEGINNERS.md`](./SETUP-GUIDE-FOR-BEGINNERS.md) | **Standalone, hand-to-a-junior guide.** Click-by-click account creation for GitHub, Railway, Vercel and video hosting, every secret explained, and what to hand back. Start here. |
| 00 | [`01-spec-analysis.md`](./01-spec-analysis.md) | What exactly does the PDF demand? Every requirement extracted and given an ID. |
| 01 | [`02-architecture-and-tech-stack.md`](./02-architecture-and-tech-stack.md) | What are we building it with, and why each choice? |
| 02 | [`03-data-model.md`](./03-data-model.md) | Strapi content types, fields, relations, constraints. |
| 03 | [`04-rbac-and-security.md`](./04-rbac-and-security.md) | The 4-role permission system and how it is enforced at 5 layers. |
| 04 | [`05-accounts-and-third-party-setup.md`](./05-accounts-and-third-party-setup.md) | Same setup, condensed for someone who already knows these tools. |
| 05 | [`06-backend-strapi-plan.md`](./06-backend-strapi-plan.md) | Strapi build plan: content types, policies, custom controllers, seeding. |
| 06 | [`07-frontend-nextjs-plan.md`](./07-frontend-nextjs-plan.md) | Next.js App Router build plan: auth, routing, data layer, caching, forms. |
| 07 | [`08-ui-design-system.md`](./08-ui-design-system.md) | Design system, page-by-page UI spec, and how to use the design skills. |
| 08 | [`09-implementation-roadmap.md`](./09-implementation-roadmap.md) | **The step-by-step build order**, day by day, with commit messages. |
| 09 | [`10-testing-and-qa.md`](./10-testing-and-qa.md) | Tests + the RBAC leak-hunting script that proves backend enforcement. |
| 10 | [`11-deployment-runbook.md`](./11-deployment-runbook.md) | Deploying Strapi to Railway, Next.js to Vercel, env vars, CORS. |
| 11 | [`12-submission-and-video.md`](./12-submission-and-video.md) | README content, commit hygiene, the 10-minute video script, submission form. |
| 12 | [`13-decisions-and-risks.md`](./13-decisions-and-risks.md) | Decision log (so you can defend every choice on video) + risk register. |
| ✅ | [`CHECKLIST.md`](./CHECKLIST.md) | Master traceability checklist — tick every requirement before submitting. |

---

## The one-paragraph summary

We build a **single public GitHub repo** containing `backend/` (Strapi 5 + PostgreSQL,
deployed to Railway) and `frontend/` (Next.js 16 App Router + TypeScript + Tailwind +
shadcn/ui, deployed to Vercel). Authentication uses Strapi's users-permissions JWT,
exchanged by a Next.js Route Handler for an **httpOnly cookie session** — no tokens in
localStorage. Four roles (Admin, Content Manager, Instructor, Student) are real Strapi
users-permissions roles, enforced in **five layers**, with record-level ownership checks
in custom Strapi policies. Quiz answers are **never sent to the browser**; grading happens
in a custom Strapi endpoint. Progress is a `lesson-progress` row per (student, lesson),
derived server-side from the JWT. Blog uses Strapi Draft & Publish with a public read API
that can only ever return published entries.

## Hard deadline

- Handed out: **24 Aug 2026**
- Deadline: **30 Aug 2026, 11:59 PM** — form closes, late = rejected.
- Today: **26 Aug 2026** → you have **~4.5 working days**. The roadmap in doc 09 is
  sized for that window, with Day 5 reserved for the video and buffer.

## Non-negotiables from the PDF

1. Next.js on Vercel + Strapi on Railway. Any other framework/host ⇒ **submission void**.
2. Backend-enforced RBAC. "Hiding buttons" is explicitly called out as insufficient.
3. A 10-minute screen recording **in your own voice** explaining your own code.
4. **Proper commit history** — one big commit is a stated negative signal.
5. All four links present (repo, Vercel URL, Railway URL, video) or the submission is
   treated as incomplete.
6. The deployed app must stay live until interviews are over.
7. AI is allowed, but a fully AI-generated project is rejected. See
   [`12-submission-and-video.md`](./12-submission-and-video.md) §"Making it yours".
