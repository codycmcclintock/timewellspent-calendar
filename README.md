# Ruffles — couples calendar & planning

**Where plans happen.** Shared calendar for couples on the web.

- **App:** Next.js in [`apps/web`](apps/web) — deploy to **Vercel** (root directory: `apps/web`)
- **Database & auth:** **Supabase** (cloud project required for production)
- **Legacy ICS:** [`calendar.ics`](calendar.ics) — imported on first setup; live feeds are `/api/feed/{token}.ics`

## Production setup (Vercel + Supabase)

### 1. Supabase (cloud)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run migrations in order:  
   [`001_initial.sql`](supabase/migrations/001_initial.sql),  
   [`002_profiles_rls.sql`](supabase/migrations/002_profiles_rls.sql),  
   [`003_event_ai_meta.sql`](supabase/migrations/003_event_ai_meta.sql).
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
| `ANTHROPIC_API_KEY` | voice planning (recommended) |
| `OPENAI_API_KEY` | voice planning (alternative) |

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

### V1 voice loop (core)

1. **Home → Plan your week** or **Plans → Joshua Tree → Talk through the trip** opens `/record`.
2. Tap the red record button (tap to start / stop). Live transcript uses browser speech (Chrome/Safari); type if needed.
3. **Pull out the moments** sends the transcript to Claude (Anthropic) and shows proposed event cards.
4. Edit or remove cards, then **Add all** — events save to Supabase and appear on the partner `.ics` feed.
5. Sunday push notifications are **not** implemented yet (web-only entry points for now).

### Joshua Tree trip UI

1. Open **Plans → Joshua Tree** (or `/plans/joshua-tree`).
2. **Import full Joshua Tree calendar** loads `public/calendar.ics` (~27 events) with day themes and rich descriptions.
3. Use the horizontal day picker, expand cards, and **Add to Google Calendar** links per event.

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
| **Record** (`/record`) | Voice → AI → confirm events |
| Home → Today | Today’s schedule with expandable details |
| Home → This Week | Weekly planner grid |
| Home → Upcoming | Upcoming event cards |
| Home → Future | Save link drafts |
| Plans | Trip boards — voice/AI or one-tap Joshua Tree import |
| Profile | Personal `.ics` subscribe URL + share |
