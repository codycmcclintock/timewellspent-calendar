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

### Google sign-in: `Unable to exchange external code`

This error comes from **Supabase ↔ Google**, before the app finishes login. Fix in this order:

1. **Google Cloud** → Credentials → your **Web** OAuth client → copy **Client ID** and **Client secret** again (or create a new secret).
2. **Supabase** → Authentication → **Providers** → **Google** → paste both → **Save** (no spaces; not the app name “Ruffles”).
3. **Google** authorized redirect URI must be exactly:  
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
4. **Supabase** → Authentication → **URL configuration** → **Redirect URLs** must include:  
   `http://localhost:3000/auth/callback` and `https://YOUR-VERCEL-DOMAIN/auth/callback`  
   (If the code lands on `http://localhost:3000/?code=...` instead, add `/auth/callback` to Redirect URLs; the app also auto-forwards `?code=` to `/auth/callback`.)
5. **OAuth consent screen** → add your Google account under **Test users** while the app is in Testing mode.

### Google Calendar access (optional scopes on sign-in)

Sign-in can request **Google Calendar** access (read + manage events) in addition to email/profile. The app’s shared calendar still lives in **Ruffles (Supabase)**; Google Calendar is for future import/sync, not required to use the app.

**Google Cloud (same project as OAuth client):**

1. **APIs & Services → Library** → enable **Google Calendar API**.
2. **OAuth consent screen → Scopes → Add or remove scopes** → add:
   - `.../auth/calendar.readonly` (See and download calendars)
   - `.../auth/calendar.events` (View and edit events on calendars you can access)
3. Re-publish or keep in **Testing** with your account as a test user.

After deploy, “Sign in with Google” should list calendar permissions on the consent screen. Sensitive scopes may require Google **verification** before public launch.

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
