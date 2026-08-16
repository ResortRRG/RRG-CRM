# RRG CRM

Sales, employees, RRG Board, payroll, and reporting — now a real deployed app
instead of a Claude artifact, so it works from any computer for your whole
team, with real per-user accounts.

## What changed from the Claude artifact version

- **Real accounts.** Passwords are hashed with bcrypt on the server and never
  stored in plain text. Sessions use secure httpOnly cookies.
- **Real database.** Everything (sales, employees, payroll, settings) lives in
  Postgres instead of Claude's artifact storage.
- **Multi-user, multi-device.** Anyone with an account can sign in from any
  browser/computer and see the same live data.
- Almost all of the app's business logic (sales, RRG Board, payroll math,
  reports, etc.) is untouched — only the login and data-storage layers changed.

## Project layout

```
rrg-crm/
  client/        Vite + React frontend (your CRM UI)
  server/        Express + Postgres backend (auth + data API)
  package.json   Root scripts Railway uses to build & start everything
  railway.json   Railway build/deploy config
```

## 1. Push this to GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Initial RRG CRM"
```

Then create a new empty repo on GitHub (github.com → New repository — don't
initialize it with a README), and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/rrg-crm.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from
   GitHub repo** → pick the `rrg-crm` repo you just pushed.
2. In the same project, click **+ New** → **Database** → **Add PostgreSQL**.
   Railway automatically injects a `DATABASE_URL` environment variable into
   your app service — you don't need to copy/paste anything.
3. Click into your app service → **Settings** → **Networking** → **Generate
   Domain**. That gives you a public `https://something.up.railway.app` URL.
4. Wait for the deploy to finish (check the **Deployments** tab for build
   logs). Railway runs `npm run build` then `npm start` automatically, using
   the scripts already set up in this repo.
5. Open the generated URL. Since there are no users yet, you'll land on a
   **"create the first admin account"** screen — fill it in once, and you're
   in.

## 3. Add your team

Once you're signed in as admin: **Admin / Settings → Users & access → Add
user**. Give each person a name, username, password, and role. Anyone you add
can sign in from their own computer/phone at the same Railway URL and use the
CRM — including submitting new sales — right alongside everyone else, with
changes showing up live for the whole team.

## Local development (optional)

If you want to run this on your own machine before/instead of deploying:

```bash
# 1. Start a local Postgres however you prefer, then:
export DATABASE_URL=postgres://user:pass@localhost:5432/rrg_crm

# 2. Backend
cd server
npm install
npm start

# 3. Frontend (separate terminal)
cd client
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:3000`
(see `client/vite.config.js`), so both need to be running at once locally.

## Notes & honest caveats

- The in-memory session store in `server/auth.js` works fine for Railway's
  default single-instance deploy. If you ever scale to multiple instances,
  swap it for a sessions table or Redis — sessions won't be shared across
  instances otherwise.
- There's no password-reset flow yet (an admin has to manually set a new
  password for someone from the Users page if they forget theirs).
- CSV export in Reports downloads directly to the browser — there's no
  server-side Google Drive integration, so uploading to Drive after
  downloading is still a manual step.
