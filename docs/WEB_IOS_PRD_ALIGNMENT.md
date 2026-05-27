# Revised Core Flow PRD — Web vs iOS mapping

The **Revised Core Flow PRD** (auto-routing, match hero, Where/When/Invite) is the north star for native iOS. The web app uses the **same Supabase schema** (`plans`, `drafts`, `couples`) — not the PRD’s greenfield `trips` / `saved_reels` / `users` tables.

Use this doc with [`IOS_STARTER_SPEC_ALIGNMENT.md`](IOS_STARTER_SPEC_ALIGNMENT.md) and [`NATIVE_IOS_SUPABASE.md`](NATIVE_IOS_SUPABASE.md).

---

## Schema mapping (do not create PRD tables on shared Supabase)

| Revised PRD | Ruffles (web + iOS) |
|-------------|---------------------|
| `trips` | `plans` |
| `saved_reels` | `drafts` (`plan_id` null = inbox stray) |
| `users` | `profiles` + `auth.users` |
| `matches` (new table) | `drafts.matched_at` + `match_partner_draft_id` (migration 006) |
| Trip invite `ruffles.app/i/xxx` | Couple `invite_token` → `/join/{token}` (v1); per-trip links later |
| `google_place_id` matching | v1: same `source_url` normalized; v1.1: add column + Places |

---

## What web ships now (aligned with PRD)

| PRD concept | Web implementation |
|-------------|-------------------|
| Auto-route reel to trip | `ingestLink` matches `destination_key` to `plans`, sets `drafts.plan_id` |
| Inbox = strays only | `plan_id IS NULL`; paywall counts only inbox strays |
| Undo toast | `ReelAutoAddToast` after auto-route; `moveDraftToInbox` |
| Match hero | `MatchedIdeasPanel` on Plans (stronger copy/styling) |
| Create trip: Where/When/**Invite** | `CreateTripStepInvite` (share link; couple join URL) |
| No auto-create trip on paste | Removed `findOrCreatePlanForDestination` from ingest |
| Teaching copy | Plans sheet + inbox copy mention auto-route |

---

## What iOS should build (not on web yet)

| PRD item | Notes |
|---------|--------|
| Share extension + App Group | iOS-only |
| `parse-reel` Edge Function + Apify + Places | Backend; web can call same API later |
| Google Places on Create Where | Web still uses featured list + free text |
| Day tabs + All / Unassigned UI | Web has `PlanWishlistView` + `suggested_day`; not full tab UX |
| Home trip cards + density warning | Web has `PlansHub` + `PlanCard` |
| Push on match | Not implemented |
| Per-trip invite tokens | Use couple join link for v1 |
| Smart Plan Pro gate | Web has `SmartPlanButton` on trip pages |

---

## API routes for iOS (live)

| Route | Purpose |
|-------|---------|
| `POST /api/ios/create-couple` | After Apple sign-in |
| `POST /api/ios/join-couple` | Invite deep link |
| `POST /api/ios/ingest-link` | Share extension / paste link (Bearer JWT) |

---

## Ingest behavior (shared logic)

**Default (paste link):**

1. Parse destination (Claude in `detectLinkDestination`)
2. If matches existing `plans.destination_key` → save to that plan (`autoRouted`)
3. Else → inbox stray (`plan_id` null), counts toward 15/month cap

**`forceInbox: true`:** Always stray (Profile inbox UI).

**`planId` set:** Save directly to that trip (no inbox cap).

---

## Create trip flow (web)

1. **Where** — featured destinations + custom label  
2. **When** — flexible month grid + nights slider, or exact date range calendar  
3. **Invite** — copy/share couple link; **Create trip** or **Just me for now**

iOS should match this sequence; per-trip invite links can come in v1.1.

---

## Recommended parallel work

| Team | Focus |
|------|--------|
| **iOS** | Welcome → couple API → Home shell → share extension → parse pipeline |
| **Web** | Google Places on Where, `parse-reel` Edge, per-trip invite tokens, `google_place_id` migration |
| **Backend** | Edge `parse-reel`, don’t fork schema to `saved_reels` |

---

## Copy locked (PRD)

- Positioning: *"Save the reel. We'll plan the trip."*
- Teaching title: *"Trips, the way you actually plan them"*
- Match: *"It's a match!"*

Web welcome (`SplashSlide`) may still use older copy — align when touching splash.
