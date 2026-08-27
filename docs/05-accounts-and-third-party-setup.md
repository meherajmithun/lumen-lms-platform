# 05 — Accounts & Third-Party Setup (click-by-click)

Do this **before** writing code. Total time: ~45 minutes. Everything here has a free tier
adequate for this project.

---

## 0. What you need, at a glance

| # | Service | Purpose | Cost | Required? |
|---|---------|---------|------|-----------|
| 1 | **GitHub** | Public repo (S-1) | Free | ✅ Mandatory |
| 2 | **Railway** | Strapi hosting + PostgreSQL (C-2) | Free trial credit / $5 Hobby | ✅ Mandatory |
| 3 | **Vercel** | Next.js hosting (C-1) | Free Hobby | ✅ Mandatory |
| 4 | **Google Drive / YouTube** | Host the 10-min video (S-4) | Free | ✅ Mandatory |
| 5 | Cloudinary | Image uploads | Free | ⬜ Optional (we use image URLs) |
| 6 | Resend / SMTP | Password-reset emails | Free | ⬜ Optional stretch |
| 7 | Sentry | Error monitoring | Free | ⬜ Optional polish |
| 8 | Local Postgres (Docker) | Prod-parity local DB | Free | ⬜ Recommended |

⚠️ **Billing warning:** Railway's free trial credit is limited and the Hobby plan is ~$5/mo.
Requirement **C-5 says the app must stay live until interviews are over.** Budget for at
least one month of Railway. Set a usage alert. A dead backend on interview day = a failed
submission.

---

## 1. GitHub

1. Sign in at <https://github.com> (create an account if needed; verify your email).
2. **New repository**
   - Name: `lms-cps` (or similar)
   - Visibility: **Public** ← required by S-1
   - ❌ Do **not** add a README/`.gitignore` from the UI — we create them locally.
3. Locally:
   ```bash
   cd /Users/moinulhossain/development/projects/lms-cps
   git init
   git branch -M main
   git remote add origin https://github.com/<you>/lms-cps.git
   ```
4. Configure your identity so commits are attributed correctly:
   ```bash
   git config user.name  "Your Name"
   git config user.email "your@email.com"
   ```
5. Create `.gitignore` at the repo root **before the first commit** (see doc 09, Step 1.2).
   Never commit `.env`, `node_modules`, `.next`, `backend/.tmp`, `backend/build`.
6. **Enable 2FA** on your GitHub account — required for some org integrations and just good practice.

> **C-7 (commit history is graded):** commit after each meaningful step. The roadmap in doc
> 09 gives you ~45 pre-written conventional-commit messages. Push at least a few times a day
> so the history shows real progression over the days, not a single dump.

---

## 2. Railway (Strapi + PostgreSQL)

### 2.1 Account
1. Go to <https://railway.com> → **Login** → **Login with GitHub** (easiest; it also grants
   repo access for deploys).
2. Authorise Railway for your account. If you only want it to see one repo, choose
   **Only select repositories** → `lms-cps`.
3. Verify your account (Railway asks for a GitHub account with some history, or a card, to
   prevent abuse). Do this **now**, not on deadline day.

### 2.2 Create the project + database
1. Dashboard → **New Project** → **Deploy PostgreSQL** (start with the DB, not the app).
2. The Postgres service appears. Open it → **Variables** tab. Note that Railway provides
   `DATABASE_URL` (and `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
3. Rename the project to `lms-backend` (Settings → Project Name) for clarity.

### 2.3 Add the Strapi service
1. In the same project → **New** → **GitHub Repo** → select `lms-cps`.
2. Open the new service → **Settings**:
   - **Root Directory**: `backend`  ← critical for a monorepo
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Watch Paths**: `backend/**` (so a frontend-only commit doesn't rebuild Strapi)
3. **Variables** tab → add (see doc 11 for the full list and how to generate values):
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=${{PORT}}
   DATABASE_CLIENT=postgres
   DATABASE_URL=${{Postgres.DATABASE_URL}}     ← use Railway's variable reference picker
   DATABASE_SSL=true
   APP_KEYS=<4 comma-separated base64 keys>
   API_TOKEN_SALT=<base64>
   ADMIN_JWT_SECRET=<base64>
   TRANSFER_TOKEN_SALT=<base64>
   JWT_SECRET=<base64>
   ENCRYPTION_KEY=<base64>
   FRONTEND_URL=https://<your-app>.vercel.app
   SEED_DEMO_DATA=true
   ```
   > Use the **"Add Variable Reference"** button for `DATABASE_URL` so it links to the
   > Postgres service rather than being copy-pasted — if Railway rotates the DB password,
   > the reference follows automatically. Mention this in the video (V-7).
4. **Settings → Networking → Generate Domain.** You get
   `https://<something>.up.railway.app`. **This is your S-3 backend URL.**
5. Deploy. Watch the build logs. First boot creates all tables and runs `bootstrap()`.

### 2.4 Create your Strapi admin-panel user
1. Open `https://<your>.up.railway.app/admin`.
2. The **first** visit shows the "Create your first administrator" form. Fill it and store
   the credentials in your password manager.
   > ⚠️ Anyone who reaches that URL before you can seize your admin panel. Do it
   > **immediately** after the first successful deploy.
3. This admin user is **separate** from the four application roles (see doc 03 §3).

### 2.5 Guard rails
- Railway → project **Settings → Usage** → set a spending limit / alert.
- Note Railway sleeps/removes services when credit runs out. Check the app is up the day
  before interviews.

---

## 3. Vercel (Next.js)

1. <https://vercel.com> → **Sign up with GitHub**.
2. **Add New… → Project** → import `lms-cps`.
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`  ← click *Edit* next to Root Directory
   - Build/Install commands: leave as defaults
4. **Environment Variables** (add for Production, Preview, and Development):
   ```
   STRAPI_URL=https://<your>.up.railway.app          # server-side only
   NEXT_PUBLIC_STRAPI_URL=https://<your>.up.railway.app  # only if a client component needs it
   SESSION_SECRET=<32+ random chars for jose>
   NEXT_PUBLIC_SITE_URL=https://<your-app>.vercel.app
   ```
   > Naming discipline: **anything prefixed `NEXT_PUBLIC_` is shipped to the browser.**
   > Secrets must never carry that prefix. This is a direct V-7 talking point.
5. **Deploy.** You get `https://<app>.vercel.app` — **this is your S-2 frontend URL.**
6. Go back to **Railway → Strapi service → Variables** and set `FRONTEND_URL` to this exact
   URL, then redeploy so CORS allows it.
7. Optional: Vercel → Settings → Domains → note the production domain; keep the default
   `.vercel.app` (custom domains are unnecessary here).

**Chicken-and-egg note:** you need the Railway URL for Vercel and the Vercel URL for
Railway's CORS. Deploy Railway first, then Vercel, then update `FRONTEND_URL` on Railway.
Write this order down — you'll narrate it in the video.

---

## 4. Local development environment

### 4.1 Prerequisites (already verified on this machine)
- Node **v22.14.0** ✅ (Strapi 5 supports 18/20/22)
- npm 11.17 ✅, git 2.50 ✅

### 4.2 Local database — two options

**Option A — SQLite (fastest to start).** Zero setup; `config/database.ts` switches on
`DATABASE_CLIENT`. Fine for local, never for production.

**Option B — Postgres in Docker (production parity, recommended).**
```bash
docker run --name lms-pg -e POSTGRES_PASSWORD=lms -e POSTGRES_USER=lms \
  -e POSTGRES_DB=lms -p 5432:5432 -d postgres:16
```
Then locally: `DATABASE_CLIENT=postgres`, `DATABASE_URL=postgres://lms:lms@localhost:5432/lms`,
`DATABASE_SSL=false`.

Option B catches Postgres-only bugs (case-sensitive ordering, JSON column behaviour)
*before* they hit production the night before the deadline.

### 4.3 Generating secrets
```bash
# one APP_KEYS value (4 keys, comma separated)
node -e "console.log(Array.from({length:4},()=>require('crypto').randomBytes(16).toString('base64')).join(','))"
# any single secret / salt / SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Generate **different** values for local and production.

---

## 5. Video hosting (S-4)

**YouTube (unlisted) — recommended**
1. <https://youtube.com> → sign in → **Create → Upload video**.
2. Visibility: **Unlisted** (not Private — Private is not openable by reviewers, and the PDF
   requires an openable link).
3. Copy the share link.

**Google Drive — alternative**
1. Upload the `.mp4`.
2. Right-click → **Share** → General access → **Anyone with the link** → **Viewer**.
3. Copy the link and **test it in a private/incognito window.** A link that asks for access
   is a failed submission.

**Recording tools (macOS):** QuickTime (`⌘⇧5`) is built in; OBS Studio is free and better
for mic + screen. Test your microphone level on a 30-second sample before the real take.

---

## 6. Optional services

### Cloudinary (only if you do real image uploads)
1. <https://cloudinary.com> → free account → Dashboard → copy **Cloud name**, **API Key**,
   **API Secret**.
2. `npm i @strapi/provider-upload-cloudinary` in `backend/`, configure in `config/plugins.ts`.
3. Add `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` to Railway.
> **Why you probably don't need it:** the PDF explicitly says "a cover image URL is fine",
> and Railway's ephemeral filesystem means local uploads vanish on redeploy. Using URL
> fields is the *correct* engineering call here, not a shortcut — say so on video.

### Sentry (optional polish)
Free account → create a Next.js project → `npx @sentry/wizard@latest -i nextjs`. Nice
"production-minded" signal, but only after the required features are done.

### Email (optional stretch — password reset)
Resend free tier + `@strapi/provider-email-nodemailer`. Skip unless you finish early.

---

## 7. Setup completion checklist

- [ ] GitHub account, **public** repo `lms-cps` created, remote added, 2FA on
- [ ] `git config user.name` / `user.email` set in the repo
- [ ] Railway account verified, project created
- [ ] Railway **PostgreSQL** service running
- [ ] Railway Strapi service: root dir `backend`, build/start commands set
- [ ] All Strapi env vars set on Railway (`DATABASE_URL` via **variable reference**)
- [ ] Railway public domain generated → **S-3 URL recorded**
- [ ] Strapi `/admin` first-administrator account created immediately after first deploy
- [ ] Vercel account, project imported, root dir `frontend`
- [ ] Vercel env vars set for **all three** environments
- [ ] Vercel deployed → **S-2 URL recorded**
- [ ] `FRONTEND_URL` on Railway updated to the Vercel URL, Strapi redeployed, CORS verified
- [ ] Railway spending limit / alert configured
- [ ] Video hosting account ready, sharing behaviour tested in incognito
- [ ] Local: Node 22, Docker Postgres (or SQLite fallback) running
- [ ] Secrets generated separately for local and production; `.env` git-ignored
