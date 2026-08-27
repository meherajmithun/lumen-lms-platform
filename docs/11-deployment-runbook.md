# 11 — Deployment Runbook

Covers video segment **V-7** ("show how you configured Vercel and Railway and how you
handled environment variables").

---

## 1. Environment variable reference

### Backend — Strapi on Railway

| Variable | Example / how to generate | Notes |
|----------|---------------------------|-------|
| `NODE_ENV` | `production` | |
| `HOST` | `0.0.0.0` | **Required.** Default `127.0.0.1` is unreachable inside a container |
| `PORT` | `${{PORT}}` | Railway injects it |
| `PUBLIC_URL` | `https://<app>.up.railway.app` | Makes the admin panel generate correct absolute URLs |
| `DATABASE_CLIENT` | `postgres` | |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Use Railway's **variable reference**, not a copy-paste |
| `DATABASE_SSL` | `true` | |
| `APP_KEYS` | `node -e "console.log(Array.from({length:4},()=>require('crypto').randomBytes(16).toString('base64')).join(','))"` | 4 comma-separated keys |
| `API_TOKEN_SALT` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | |
| `ADMIN_JWT_SECRET` | same generator | Signs **admin-panel** sessions |
| `TRANSFER_TOKEN_SALT` | same generator | |
| `JWT_SECRET` | same generator | Signs **end-user** (users-permissions) JWTs |
| `ENCRYPTION_KEY` | same generator | Required by Strapi 5 |
| `FRONTEND_URL` | `https://<app>.vercel.app` | CORS allowlist |
| `SEED_DEMO_DATA` | `true` | Set `false` after the first successful seed |
| `NODE_OPTIONS` | `--max-old-space-size=2048` | Only if the admin build OOMs |

### Frontend — Next.js on Vercel

| Variable | Example | Notes |
|----------|---------|-------|
| `STRAPI_URL` | `https://<app>.up.railway.app` | **Server-only.** No `NEXT_PUBLIC_` prefix |
| `NEXT_PUBLIC_SITE_URL` | `https://<app>.vercel.app` | For canonical/OG URLs |
| `SESSION_SECRET` | 32+ random chars | Signs the `lms_session` cookie |
| `NEXT_PUBLIC_STRAPI_URL` | only if a client component genuinely needs it | Prefer not to need it |

> **The `NEXT_PUBLIC_` rule, stated for the video:** anything with that prefix is inlined
> into the JavaScript bundle and is therefore public forever. `STRAPI_URL` and
> `SESSION_SECRET` deliberately do **not** carry it. Show `.env.example` on screen while
> saying this.

Set every Vercel variable for **Production, Preview and Development** — a missing Preview
value produces confusing broken preview deploys.

---

## 2. Deployment order (there's a dependency cycle — respect it)

```
1. Railway: create Postgres
2. Railway: deploy Strapi (root dir `backend`)     → get RAILWAY_URL
3. Railway: open /admin, create the first administrator IMMEDIATELY
4. Vercel:  deploy Next.js with STRAPI_URL=RAILWAY_URL  → get VERCEL_URL
5. Railway: set FRONTEND_URL=VERCEL_URL → redeploy (CORS)
6. Verify: the Vercel app can log in against Railway
```

Steps 4 and 5 are the cycle: Vercel needs Railway's URL, Railway needs Vercel's for CORS.
Deploy Railway first, then Vercel, then circle back. Say this on camera — it shows you
understand the wiring rather than having clicked until it worked.

---

## 3. Railway service settings (monorepo)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| Watch Paths | `backend/**` |
| Healthcheck Path | `/_health` (Strapi's built-in, returns 204) |
| Restart Policy | On failure |

`backend/package.json` must have:
```json
{ "scripts": { "build": "strapi build", "start": "strapi start", "develop": "strapi develop" },
  "engines": { "node": ">=20.0.0 <=22.x.x" } }
```

---

## 4. Vercel project settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `frontend` |
| Node version | 22.x |
| Build Command | default (`next build`) |
| Ignored Build Step | `git diff --quiet HEAD^ HEAD -- ./` (skips builds for backend-only commits) |

---

## 5. Post-deploy verification (run after **every** production deploy)

```bash
BE=https://<app>.up.railway.app
FE=https://<app>.vercel.app

curl -s -o /dev/null -w '%{http_code}\n' $BE/_health          # 204
curl -s "$BE/api/posts" | head -c 200                          # published posts only
curl -s -o /dev/null -w '%{http_code}\n' $BE/api/users         # 403
curl -s -o /dev/null -w '%{http_code}\n' $FE                   # 200
curl -sI "$FE/blog" | grep -i 'x-vercel-cache'                 # ISR working
bash scripts/rbac-check.sh $BE                                 # all PASS
```

Plus manually: log in on the deployed frontend as each of the four roles.

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Railway build succeeds, container exits immediately | `HOST` not `0.0.0.0`, or `PORT` hardcoded | Set `HOST=0.0.0.0`, read `PORT` from env |
| `ECONNREFUSED` to Postgres | `DATABASE_URL` copy-pasted and stale | Re-link via **Add Variable Reference** |
| `self signed certificate in certificate chain` | Railway PG SSL | `ssl: { rejectUnauthorized: false }` |
| 403 on everything in production, fine locally | Role permissions live in the DB, not git | The `bootstrap()` permission seeding |
| All data vanished after a deploy | SQLite on an ephemeral filesystem | Use the Postgres service |
| CORS error in the browser console | `FRONTEND_URL` unset/mismatched (trailing slash counts) | Fix and redeploy Strapi |
| Login works, then every request 401s | Cookie not sent — `secure: true` over http, or a `sameSite` mismatch | `secure` only in production; `sameSite: 'lax'` |
| Vercel build fails on `STRAPI_URL is undefined` | Env var missing for that environment | Add it to all three environments |
| Admin panel assets 404 on Railway | `PUBLIC_URL` not set | Set it to the Railway domain |
| Build OOM | Strapi admin build memory | `NODE_OPTIONS=--max-old-space-size=2048` |
| Blog page shows stale content after publishing | Missing revalidation | `revalidateTag('posts')` in the publish action |

---

## 7. Keeping it alive until interviews (C-5)

- [ ] Railway spending limit set, with an email alert
- [ ] Enough credit for **at least one month** beyond the deadline
- [ ] `SEED_DEMO_DATA=false` after the first seed, so a redeploy can't duplicate demo rows
- [ ] Uptime check (e.g. a free UptimeRobot monitor on `/_health`)
- [ ] Don't delete the Railway project or the GitHub repo after submitting
- [ ] Re-verify both URLs the morning of any interview

---

## 8. Rollback

- **Vercel:** Deployments → pick the last good one → **Promote to Production**. Instant.
- **Railway:** Deployments → previous deployment → **Redeploy**.
- **Database:** Railway Postgres → Backups. Take a manual backup **before** the video
  recording so a bad demo action can be undone.
