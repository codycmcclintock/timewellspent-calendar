# Ruffles — couples calendar & planning

**Where plans happen.** Shared calendar for couples on the web.

- **App:** Next.js in [`apps/web`](apps/web) — deploy to **Vercel** (root directory: `apps/web`)
- **Database & auth:** **Supabase** (cloud project required for production)
- **Legacy ICS:** [`calendar.ics`](calendar.ics) — imported on first setup; live feeds are `/api/feed/{token}.ics`

## Production setup (Vercel + Supabase)

### 1. Supabase (cloud)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).
3. **Authentication → Providers:** enable **Google** and **Apple**.
4. **Authentication → URL configuration:** add redirect URLs:
   - `https://YOUR-VERCEL-DOMAIN/auth/callback`
   - `http://localhost:3000/auth/callback` (for local testing)
5. Copy **Project URL**, **anon key**, and **service_role** key.

### 2. Vercel

1. Import this repo on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Add environment variables:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-VERCEL-DOMAIN` |
| `RESEND_API_KEY` | optional |
| `RESEND_FROM_EMAIL` | optional |

4. Deploy. Sign in with **Apple** or **Google** only (no dev email login in production).

### 3. GitHub

Repo: [github.com/codycmcclintock/timewellspent-calendar](https://github.com/codycmcclintock/timewellspent-calendar)

Push `main` → Vercel redeploys if connected.

## Local development (optional)

Requires Docker for `supabase start`. See [`scripts/dev.sh`](scripts/dev.sh). Use a **cloud** Supabase project instead if you prefer not to run Docker.

```bash
cd apps/web && cp .env.example .env.local
# Fill with cloud OR local Supabase keys — do NOT set NEXT_PUBLIC_DEV_LOGIN
npm install && npm run dev
```

## App overview

| Area | Description |
|------|-------------|
| Home → Today | Today’s schedule with expandable details |
| Home → This Week | Weekly planner grid |
| Home → Upcoming | Upcoming event cards |
| Home → Future | Save link drafts |
| Plans | Trip boards (e.g. Joshua Tree) |
| Profile | Personal `.ics` subscribe URL + share |
