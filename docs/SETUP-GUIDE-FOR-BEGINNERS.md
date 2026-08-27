# Third-Party Setup Guide — Start Here

**Who this is for:** someone who has never used Strapi, Railway, or Vercel before.
**How long it takes:** about 90 minutes, going slowly.
**What you need:** a laptop, an email address, a browser, and a card for Railway (see §1.3).

You do **not** need to understand the LMS project to complete this guide. You are setting up
accounts and copying values into a file. Every step says exactly what to click and what to
copy. When you finish, hand back the filled-in table in **Part 10**.

> This document is standalone. You do not need to read any other file in `docs/`.

---

## Jargon decoder (read this once, it will make everything else make sense)

| Word | What it actually means |
|------|------------------------|
| **Frontend** | The website people look at. Built with **Next.js**. Lives on **Vercel**. |
| **Backend** | The part that stores data and decides who's allowed to do what. Built with **Strapi**. Lives on **Railway**. |
| **Strapi** | A ready-made backend/admin system. You define "a Course has a title and lessons" and it gives you a database and an API for free. |
| **Railway** | A hosting company. We put Strapi and its database there. Think "a computer on the internet that runs our backend". |
| **Vercel** | A hosting company owned by the makers of Next.js. We put the website there. |
| **PostgreSQL (Postgres)** | The database — the filing cabinet where all users, courses and progress are stored. |
| **API** | The way the frontend asks the backend for things. Just URLs, like `.../api/courses`. |
| **Environment variable** (env var) | A named setting given to a program from outside its code. Written `NAME=value`. Used so passwords never get written into the code. |
| **Secret / key / salt** | A long random string that acts as a password for a program. We generate these ourselves. |
| **Deploy** | To publish. "Deploying to Railway" = putting the backend live on the internet. |
| **Repository (repo)** | A folder of code stored on GitHub. |
| **CORS** | A browser rule: a website at address A is blocked from talking to a server at address B unless B says "A is allowed". We have to tell Strapi to allow our Vercel address. |
| **Root directory** | Our repo has two projects inside it (`backend/` and `frontend/`). Each host needs to be told which folder is *theirs*. |

---

## The big picture

```
    GitHub  (stores all the code)
       │
       ├──────────────► Railway ──── runs Strapi (backend)  ─── talks to ──► PostgreSQL
       │                   │                                                (database)
       │                   │  gives you a URL like https://xxx.up.railway.app
       │                   ▼
       └──────────────► Vercel ───── runs Next.js (frontend)
                           │
                           │  gives you a URL like https://xxx.vercel.app
                           ▼
                    People visit this one
```

There are **four accounts** to create, in this order:

| # | Service | What it's for | Cost |
|---|---------|---------------|------|
| 1 | **GitHub** | Stores the code | Free |
| 2 | **Railway** | Runs the backend + database | ~$5/month (see §1.3) |
| 3 | **Vercel** | Runs the website | Free |
| 4 | **YouTube or Google Drive** | Hosts the demo video | Free |

Order matters. Do them **1 → 2 → 3 → 4**. Railway must exist before Vercel, because Vercel
needs Railway's address.

---

# Part 0 — Make your notes file first

Before touching any website, create a file on your computer to paste values into. You will
collect about 15 values along the way, and hunting for them later is miserable.

1. Open TextEdit (or any notes app).
2. Save a file called `lms-setup-notes.txt` on your Desktop.
3. Paste this template into it:

```
=== GITHUB ===
Repo URL:

=== SECRETS (generated in Part 2) ===
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
JWT_SECRET=
ENCRYPTION_KEY=
SESSION_SECRET=

=== RAILWAY ===
Backend URL:
Strapi admin panel email:
Strapi admin panel password:

=== VERCEL ===
Frontend URL:

=== VIDEO ===
Video link:
```

> ⚠️ **This file contains passwords.** Do not put it inside the project folder, do not email
> it, and do not commit it to GitHub. Desktop is fine for now; a password manager is better.

---

# Part 1 — GitHub

GitHub stores the code. The project must be **public** — that is a requirement of the task.

### 1.1 Create the account
1. Go to **https://github.com**
2. Click **Sign up**. Use a real email you can check.
3. Verify your email (they send a code).
4. Pick a username — it appears in your repo URL, so keep it professional.

### 1.2 Turn on two-factor authentication (5 minutes, do it now)
1. Click your avatar (top right) → **Settings**
2. Left sidebar → **Password and authentication**
3. **Enable two-factor authentication** → follow the prompts (an authenticator app on your
   phone is easiest)

GitHub requires 2FA for many features, and you do not want to discover that on deadline day.

### 1.3 Create the repository
1. Click the **+** (top right) → **New repository**
2. **Repository name:** `lms-cps`
3. **Description:** `LMS built with Next.js and Strapi`
4. Select **Public** ← this is required
5. ❌ Leave **"Add a README file"** unchecked
6. ❌ Leave **.gitignore** and **license** as "None"
   *(We create those on the computer instead. Adding them here causes a confusing conflict
   on the first push.)*
7. Click **Create repository**

### 1.4 Copy the URL
The next page shows a URL like `https://github.com/yourname/lms-cps.git`.

📋 **Paste it into your notes file under `Repo URL:`**

### ✅ Checkpoint 1
- [ ] GitHub account created and email verified
- [ ] 2FA enabled
- [ ] Repository `lms-cps` exists and is **Public**
- [ ] Repo URL saved in notes

---

# Part 2 — Generate the secrets

Strapi needs six long random strings to work. These are like passwords for the program
itself. We generate them on your computer — nobody gives them to you.

### 2.1 Open the Terminal
Press `⌘ + Space`, type `Terminal`, press Enter. A black or white window with text appears.
That's it — you'll paste commands into it.

### 2.2 Check Node is installed
Paste this and press Enter:
```bash
node -v
```
You should see something like `v22.14.0`.

- If you see a version number starting with **v20** or **v22** → you're good, continue.
- If you see `command not found` → install Node first from **https://nodejs.org** (choose
  the **LTS** version), then close and reopen Terminal and try again.

### 2.3 Generate all six secrets at once
Copy this **entire block**, paste it into Terminal, press Enter:

```bash
node -e '
const c = require("crypto");
const one = () => c.randomBytes(32).toString("base64");
console.log("APP_KEYS=" + Array.from({length:4}, () => c.randomBytes(16).toString("base64")).join(","));
console.log("API_TOKEN_SALT=" + one());
console.log("ADMIN_JWT_SECRET=" + one());
console.log("TRANSFER_TOKEN_SALT=" + one());
console.log("JWT_SECRET=" + one());
console.log("ENCRYPTION_KEY=" + one());
console.log("SESSION_SECRET=" + one());
'
```

It prints seven lines that look like:
```
APP_KEYS=aB3d...,xY9z...,pQ2m...,kL7n...
API_TOKEN_SALT=Zm9vYmFy...
...
```

📋 **Copy all seven lines into your notes file, replacing the empty `SECRETS` block.**

### What each one is for (you don't need to memorise this)

| Secret | Purpose |
|--------|---------|
| `APP_KEYS` | Signs browser cookies. Must be 4 keys separated by commas, no spaces. |
| `API_TOKEN_SALT` | Scrambles API tokens before storing them. |
| `ADMIN_JWT_SECRET` | Signs logins for the **Strapi admin panel** (the developer dashboard). |
| `TRANSFER_TOKEN_SALT` | For Strapi's data import/export feature. |
| `JWT_SECRET` | Signs logins for **app users** (students, instructors, etc.). Different from the one above — Strapi genuinely has two separate login systems. |
| `ENCRYPTION_KEY` | Encrypts stored token values. Required in Strapi 5. |
| `SESSION_SECRET` | Used by the **frontend** (Next.js), not Strapi. Signs the login cookie. |

> ⚠️ **Never reuse these anywhere else, never paste them into a chat window, a GitHub issue,
> or a screenshot.** If one leaks, generate a new one and replace it.

### ✅ Checkpoint 2
- [ ] All seven secrets generated and saved in notes
- [ ] `APP_KEYS` has exactly **four** values separated by three commas
- [ ] No secret was typed by hand (they must be the generated random ones)

---

# Part 3 — Railway (the backend + database)

Railway is where Strapi and the database will live.

### 3.1 About the cost — read this before signing up
Railway is **not free** beyond a small trial credit. The Hobby plan is about **$5/month**.

The task requires the app to **stay live until the interviews are over**, so budget for at
least one month. If Railway runs out of credit, the backend goes offline and the whole
submission fails.

### 3.2 Create the account
1. Go to **https://railway.com**
2. Click **Login** → **Login with GitHub**
3. Click **Authorize Railway**
4. When asked for repository access, you can choose **Only select repositories** → pick
   `lms-cps`. (Or "All repositories" — either works.)
5. Railway may ask you to verify with a payment card. Do this **now**, not later.

### 3.3 Create the project and the database

We create the **database first**, then the app.

1. On the Railway dashboard, click **New Project**
2. Choose **Deploy PostgreSQL**
3. Wait ~30 seconds. A purple box labelled **Postgres** appears.
4. Rename the project for clarity: top-left project name → **Settings** → change the name to
   `lms-backend` → save.

You now have an empty database. You never need to open it.

### 3.4 Add the Strapi service

1. In the same project, click **+ Create** (or **New**) → **GitHub Repo**
2. Select `lms-cps`
3. A second box appears and immediately tries to build. **It will fail.** That is expected —
   we haven't told it where the backend code is yet. Ignore the red error.

### 3.5 Point it at the `backend` folder

Our repo holds two projects. Railway must be told to only look at `backend`.

1. Click the new service box → **Settings** tab
2. Find **Source** → **Root Directory** → set it to:
   ```
   /backend
   ```
   *(with the leading slash)*
3. Scroll to **Build** → **Build Command**:
   ```
   npm ci && npm run build
   ```
4. **Deploy** → **Start Command**:
   ```
   npm run start
   ```
5. **Watch Paths** (optional but nice) — add:
   ```
   /backend/**
   ```
   This stops Railway rebuilding the backend when only the website changes.

### 3.6 Add the environment variables

This is the fiddliest step. Take it slowly.

1. Click the Strapi service → **Variables** tab
2. Click **RAW Editor** (much faster than adding them one at a time)
3. Paste this block, then **replace every `PASTE_...` with the matching value from your
   notes file**:

```
NODE_ENV=production
HOST=0.0.0.0
PORT=${{PORT}}
DATABASE_CLIENT=postgres
DATABASE_SSL=true
APP_KEYS=PASTE_APP_KEYS
API_TOKEN_SALT=PASTE_API_TOKEN_SALT
ADMIN_JWT_SECRET=PASTE_ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT=PASTE_TRANSFER_TOKEN_SALT
JWT_SECRET=PASTE_JWT_SECRET
ENCRYPTION_KEY=PASTE_ENCRYPTION_KEY
SEED_DEMO_DATA=true
```

4. Click **Save** / **Update Variables**.

Notice `PORT=${{PORT}}` — leave that exactly as written. Railway fills it in automatically.

### 3.7 Link the database (do this one specially)

Do **not** copy-paste the database password. Link it instead, so it keeps working if
Railway ever rotates it.

1. Still in **Variables**, click **+ New Variable**
2. **Name:** `DATABASE_URL`
3. Click in the **Value** box and type `${{`
   → an autocomplete dropdown appears
4. Choose **Postgres** → then **DATABASE_URL**
   The value becomes `${{Postgres.DATABASE_URL}}`
5. Click **Add**

> This is called a **reference variable**. It means "whatever the Postgres service's
> DATABASE_URL is right now". This is the correct way to connect services on Railway.

### 3.8 Give it a public web address

1. Strapi service → **Settings** tab → scroll to **Networking**
2. Under **Public Networking**, click **Generate Domain**
3. If it asks for a port, enter `1337`
4. You get a URL like `https://lms-backend-production-a1b2.up.railway.app`

📋 **Paste it into your notes under `Backend URL:`** — you'll need it twice more.

### 3.9 Add the public URL back as a variable

1. **Variables** tab → **+ New Variable**
2. Name: `PUBLIC_URL`, Value: the URL you just copied (no trailing slash)
3. Save. Railway redeploys automatically.

### 3.10 Watch the deploy

Click the **Deployments** tab → click the newest deployment → **View Logs**.

- Scrolling text is normal. It takes 3–6 minutes the first time.
- Success looks like a box saying **"Welcome back!"** and
  `To manage your project 🚀, go to the administration panel at: /admin`
- If it fails, jump to **Part 12 — Troubleshooting**.

### ✅ Checkpoint 3
- [ ] Railway account created and verified
- [ ] Postgres service running
- [ ] Strapi service with Root Directory `/backend`
- [ ] All environment variables set
- [ ] `DATABASE_URL` added as a **reference**, not pasted text
- [ ] Public domain generated and saved in notes
- [ ] Deployment shows a success message in the logs

---

# Part 4 — Create your Strapi admin account

Strapi has its own developer dashboard. The **first person to open it claims it forever**,
so do this immediately after the first successful deploy.

1. Open your Backend URL with `/admin` on the end:
   ```
   https://your-backend-url.up.railway.app/admin
   ```
2. You'll see **"Welcome to Strapi — Create your first administrator"**
3. Fill in first name, last name, email, and a strong password
4. Click **Let's start**

📋 **Save that email and password in your notes file.**

> ⚠️ Do this **the same minute** the deploy succeeds. Anyone who finds the URL before you
> can take over the panel.

> 💡 **Confusing but important:** this admin account is for the *Strapi dashboard*. It is
> **not** the same as the app's Admin role (the person who manages students and courses in
> the LMS). Two completely separate login systems. Everyone gets confused by this once.

### ✅ Checkpoint 4
- [ ] `/admin` opens and shows the Strapi dashboard
- [ ] Admin email + password saved in notes

---

# Part 5 — Vercel (the website)

### 5.1 Create the account
1. Go to **https://vercel.com**
2. Click **Sign Up** → **Continue with GitHub**
3. Authorize Vercel
4. Choose the **Hobby** plan (free) and confirm it's for personal use

### 5.2 Import the project
1. Dashboard → **Add New…** → **Project**
2. Find `lms-cps` in the list → **Import**
   *(If it's not listed: **Adjust GitHub App Permissions** → grant access to the repo.)*

### 5.3 Point it at the `frontend` folder
On the configuration screen, **before** clicking Deploy:

1. **Framework Preset** → should already say **Next.js**. Leave it.
2. Find **Root Directory** → click **Edit** → select or type:
   ```
   frontend
   ```
   *(no leading slash here — Vercel and Railway differ on this, which is annoying but true)*
3. Leave Build and Output settings on their defaults.

### 5.4 Add the environment variables
Expand **Environment Variables** on the same screen and add these three.
**Tick all three environment boxes** (Production, Preview, Development) for each one.

| Name | Value |
|------|-------|
| `STRAPI_URL` | your Backend URL from §3.8 (no trailing slash) |
| `SESSION_SECRET` | the `SESSION_SECRET` from your notes |
| `NEXT_PUBLIC_SITE_URL` | leave blank for now — we fill it in at §5.6 |

> ⚠️ **The most important naming rule on this whole page:**
> any variable starting with **`NEXT_PUBLIC_`** gets baked into the website and is
> **visible to anyone** who opens the browser's developer tools.
> `STRAPI_URL` and `SESSION_SECRET` deliberately do **not** have that prefix, because they
> are secrets. Never add `NEXT_PUBLIC_` to a secret.

### 5.5 Deploy
Click **Deploy**. Wait 2–4 minutes. You'll get a celebration screen with a URL like
`https://lms-cps.vercel.app`.

📋 **Paste it into your notes under `Frontend URL:`**

### 5.6 Add the site URL back
1. Project → **Settings** → **Environment Variables**
2. Add `NEXT_PUBLIC_SITE_URL` = your Vercel URL (all three environments)
3. Go to **Deployments** → newest one → **⋯** menu → **Redeploy**

> Environment variable changes only apply to **new** deployments. Changing a variable does
> nothing until you redeploy. This catches everyone out at least once.

### ✅ Checkpoint 5
- [ ] Vercel account created
- [ ] Project imported with Root Directory `frontend`
- [ ] `STRAPI_URL` and `SESSION_SECRET` set for all three environments
- [ ] Deployed successfully, URL saved in notes
- [ ] `NEXT_PUBLIC_SITE_URL` added and redeployed

---

# Part 6 — Connect the two (the CORS step)

Right now Railway doesn't know the website exists, so browsers will block them from talking.

1. Go back to **Railway** → your Strapi service → **Variables**
2. Add a new variable:
   - **Name:** `FRONTEND_URL`
   - **Value:** your Vercel URL, e.g. `https://lms-cps.vercel.app`
   - ⚠️ **No trailing slash.** `https://lms-cps.vercel.app/` (with slash) will silently fail.
3. Save → Railway redeploys automatically → wait for it to go green

### Why this order?
It's a chicken-and-egg: Vercel needs Railway's address, and Railway needs Vercel's address.
So: **deploy Railway first → deploy Vercel → come back and tell Railway about Vercel.**

### ✅ Checkpoint 6
- [ ] `FRONTEND_URL` set on Railway, no trailing slash
- [ ] Railway redeployed successfully

---

# Part 7 — Local setup (on your own computer)

So you can work on the project without deploying every time.

### 7.1 Get the code
```bash
cd ~/Desktop
git clone https://github.com/YOURNAME/lms-cps.git
cd lms-cps
```

### 7.2 Tell git who you are
```bash
git config user.name "Your Full Name"
git config user.email "your@email.com"
```

### 7.3 The two local settings files

These files hold local settings. **They must never be uploaded to GitHub** — a `.gitignore`
file in the project already blocks them, but double-check with `git status` before your
first push: if you ever see `.env` in the list, stop and ask.

**`backend/.env`** — create it with:
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=<generate a NEW set, see Part 2>
API_TOKEN_SALT=<new>
ADMIN_JWT_SECRET=<new>
TRANSFER_TOKEN_SALT=<new>
JWT_SECRET=<new>
ENCRYPTION_KEY=<new>
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`** — create it with:
```
STRAPI_URL=http://localhost:1337
SESSION_SECRET=<generate a new one>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> 💡 **Generate fresh secrets for local — don't reuse the production ones.** Run the Part 2
> command again. If your laptop is ever compromised, production stays safe.
>
> 💡 Local uses **SQLite** (a simple file) instead of Postgres, just so you don't have to
> install a database. Production must always be Postgres.

### 7.4 Run both
Two Terminal windows:

```bash
# Window 1 — backend
cd ~/Desktop/lms-cps/backend
npm install
npm run develop        # opens http://localhost:1337/admin
```

```bash
# Window 2 — frontend
cd ~/Desktop/lms-cps/frontend
npm install
npm run dev            # opens http://localhost:3000
```

### ✅ Checkpoint 7
- [ ] Code cloned, git name/email configured
- [ ] `backend/.env` and `frontend/.env.local` created with **fresh** local secrets
- [ ] `git status` does **not** list any `.env` file
- [ ] Both apps run locally

---

# Part 8 — Video hosting

The submission needs a video link that reviewers can actually open.

### Option A — YouTube (recommended)
1. Go to **https://youtube.com**, sign in with a Google account
2. Click **Create** (camera icon, top right) → **Upload video**
3. Drag in the video file
4. **Visibility → Unlisted**
   ⚠️ **Unlisted, not Private.** Private means nobody but you can open it, which fails the
   submission. Unlisted means "anyone with the link, but not searchable" — that's what you want.
5. Click **Save**, copy the share link

### Option B — Google Drive
1. Upload the video file to Drive
2. Right-click → **Share**
3. Under **General access**, change "Restricted" → **Anyone with the link**
4. Role: **Viewer**
5. **Copy link**

### 8.1 Test it — this step is not optional
1. Open a **private / incognito window** (`⌘ + Shift + N` in Chrome)
2. Paste the link
3. The video must play **without asking to log in or request access**

If it asks for access, the sharing setting is wrong. Fix it and test again.

📋 **Save the link in your notes under `Video link:`**

### ✅ Checkpoint 8
- [ ] Video hosting account ready
- [ ] Sharing tested in an incognito window

---

# Part 9 — Optional services (skip unless you have spare time)

These are **not required**. Do the main project first.

| Service | What it adds | When to bother |
|---------|--------------|----------------|
| **Cloudinary** | Real image uploads instead of pasting image URLs | Only if you finish early. The task explicitly says "a cover image URL is fine", and Railway wipes uploaded files on redeploy, so image URLs are actually the *better* choice here. |
| **Sentry** | Emails you when the live site crashes | Nice polish, zero marks |
| **Resend** | Password-reset emails | Not required by the task |
| **UptimeRobot** | Free alert if the backend goes offline | Genuinely useful — the app must stay live until interviews |

**UptimeRobot (5 minutes, recommended):** sign up free at uptimerobot.com → **Add New
Monitor** → type **HTTP(s)** → URL = `https://your-backend.up.railway.app/_health` → it
emails you if the backend dies.

---

# Part 10 — What to hand back

Fill this in and give it to the developer. **Send it through a private channel** (a password
manager share, or a direct message — not a public repo, not a public chat).

## ✅ Safe to share — needed to continue the work

| # | Item | Your value |
|---|------|-----------|
| 1 | GitHub repo URL | `https://github.com/______/lms-cps` |
| 2 | Backend URL (Railway) | `https://______.up.railway.app` |
| 3 | Frontend URL (Vercel) | `https://______.vercel.app` |
| 4 | Strapi admin panel email | `______` |
| 5 | Strapi admin panel password | `______` |
| 6 | Confirmation: all Railway variables set? | yes / no |
| 7 | Confirmation: all Vercel variables set? | yes / no |
| 8 | Confirmation: `FRONTEND_URL` set on Railway? | yes / no |
| 9 | Video hosting chosen | YouTube / Drive |

## ⚠️ Do NOT paste these into a chat

The six Strapi secrets and `SESSION_SECRET` should stay **only** in Railway's and Vercel's
variable panels and in your local `.env` files. Nobody needs to see their values to work on
the project — the hosting platforms already have them.

If you're asked "did you set `JWT_SECRET`?", the answer is **"yes"** — not the value.

The only exception: if something is broken and a value must be checked, generate a
**replacement** afterwards and update it in Railway/Vercel.

## 🔒 Never, under any circumstances

- Commit a `.env` file to GitHub (the repo is **public** — the whole world would see it)
- Paste secrets into a GitHub issue, a screenshot, or a screen recording
- Reuse production secrets locally

---

# Part 11 — Final verification

Run these to confirm everything is wired up. Replace the URLs with yours.

### In the browser
| Check | URL | Expected |
|-------|-----|----------|
| Frontend loads | `https://your-app.vercel.app` | A page appears (may be the starter page — that's fine at this stage) |
| Strapi admin loads | `https://your-backend.up.railway.app/admin` | Login screen, and your admin login works |
| Backend API responds | `https://your-backend.up.railway.app/api/posts` | Some JSON text, or a 403/404 error — **any** response means it's alive. A "site can't be reached" means it's not. |

### In the Terminal
```bash
# should print 204
curl -s -o /dev/null -w '%{http_code}\n' https://your-backend.up.railway.app/_health

# should print 200
curl -s -o /dev/null -w '%{http_code}\n' https://your-app.vercel.app
```

### Master checklist

**GitHub**
- [ ] Account created, email verified, 2FA on
- [ ] Repo `lms-cps` exists and is **Public**

**Secrets**
- [ ] Seven values generated and saved privately
- [ ] `APP_KEYS` contains four comma-separated values
- [ ] Separate secrets generated for local use

**Railway**
- [ ] Postgres service running
- [ ] Strapi service, Root Directory `/backend`
- [ ] Build `npm ci && npm run build`, Start `npm run start`
- [ ] All variables set; `DATABASE_URL` is a **reference**
- [ ] `PUBLIC_URL` and `FRONTEND_URL` set, no trailing slashes
- [ ] Public domain generated
- [ ] Deploy succeeded
- [ ] Strapi `/admin` account created immediately
- [ ] Spending limit / alert configured

**Vercel**
- [ ] Project imported, Root Directory `frontend`
- [ ] `STRAPI_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL` set for **all three** environments
- [ ] No secret carries a `NEXT_PUBLIC_` prefix
- [ ] Deployed successfully

**Local**
- [ ] Repo cloned, git identity set
- [ ] `.env` files created and **not** tracked by git
- [ ] Both apps run locally

**Video**
- [ ] Hosting ready, sharing tested in incognito

---

# Part 12 — Troubleshooting

### Railway

**"Build failed" / "npm: command not found"**
Root Directory is wrong. Settings → Source → Root Directory must be exactly `/backend`.

**Build succeeds, then the service immediately stops**
Usually `HOST`. It must be `0.0.0.0`, not `localhost` or `127.0.0.1`. Inside a container,
`localhost` means "only me", so nothing outside can reach it.

**`error: connect ECONNREFUSED` or database errors**
`DATABASE_URL` is missing or was pasted as text. Delete it and re-add it using the
`${{` autocomplete → Postgres → DATABASE_URL.

**`self signed certificate in certificate chain`**
`DATABASE_SSL=true` is missing from the variables.

**"JavaScript heap out of memory" during build**
Add a variable `NODE_OPTIONS` = `--max-old-space-size=2048` and redeploy.

**Everything worked, then all my data vanished after a deploy**
The database is SQLite instead of Postgres. Railway erases the container's files on every
deploy. `DATABASE_CLIENT` must be `postgres` in production.

**`/admin` loads but the styling is broken**
`PUBLIC_URL` is missing or wrong. Set it to the exact Railway URL, no trailing slash.

### Vercel

**"No Next.js version detected"**
Root Directory is wrong. Settings → Build & Deployment → Root Directory → `frontend`.

**Build fails with "STRAPI_URL is not defined"**
The variable wasn't ticked for that environment. Set it for Production, Preview **and**
Development, then redeploy.

**I changed a variable but nothing changed**
Variables only apply to new deployments. Deployments → newest → ⋯ → **Redeploy**.

### The two talking to each other

**Browser console shows a red CORS error**
`FRONTEND_URL` on Railway is missing, misspelled, or has a trailing slash. Fix it, save, wait
for the redeploy.

**Login works, then every page says "not logged in"**
Usually a cookie issue: cookies marked `secure` can't be set over plain `http`. Make sure
you're visiting the `https://` version of the site.

### Still stuck?
Write down: **what you clicked**, **what you expected**, **what actually appeared** (copy the
exact error text, not a summary), and which Part number you were on. That makes it solvable
in one message instead of ten.

---

# Appendix — Every environment variable, in one table

## Railway (backend / Strapi)

| Variable | Value | Where it comes from |
|----------|-------|---------------------|
| `NODE_ENV` | `production` | type it |
| `HOST` | `0.0.0.0` | type it |
| `PORT` | `${{PORT}}` | type it exactly |
| `PUBLIC_URL` | your Railway URL | §3.8 |
| `DATABASE_CLIENT` | `postgres` | type it |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | **reference**, §3.7 |
| `DATABASE_SSL` | `true` | type it |
| `APP_KEYS` | 4 comma-separated keys | Part 2 |
| `API_TOKEN_SALT` | random | Part 2 |
| `ADMIN_JWT_SECRET` | random | Part 2 |
| `TRANSFER_TOKEN_SALT` | random | Part 2 |
| `JWT_SECRET` | random | Part 2 |
| `ENCRYPTION_KEY` | random | Part 2 |
| `FRONTEND_URL` | your Vercel URL | §6, **no trailing slash** |
| `SEED_DEMO_DATA` | `true` (later `false`) | type it |
| `NODE_OPTIONS` | `--max-old-space-size=2048` | only if the build runs out of memory |

## Vercel (frontend / Next.js)

| Variable | Value | Public? |
|----------|-------|---------|
| `STRAPI_URL` | your Railway URL | 🔒 server-only |
| `SESSION_SECRET` | random | 🔒 server-only |
| `NEXT_PUBLIC_SITE_URL` | your Vercel URL | 🌍 visible in the browser (fine — it's just the address) |

## Local

| File | Variables |
|------|-----------|
| `backend/.env` | same as Railway, but `DATABASE_CLIENT=sqlite`, `DATABASE_FILENAME=.tmp/data.db`, `FRONTEND_URL=http://localhost:3000`, and **fresh** secrets |
| `frontend/.env.local` | `STRAPI_URL=http://localhost:1337`, a fresh `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000` |

---

**Sources:** verified August 2026 against
[Strapi 5 environment configuration](https://docs.strapi.io/cms/configurations/environment),
[Strapi sample .env](https://docs.strapi.io/snippets/sample-env),
[Railway variables](https://docs.railway.com/guides/variables),
[Railway monorepo deployment](https://docs.railway.com/guides/monorepo), and
[Vercel environment variables](https://vercel.com/docs/environment-variables).
