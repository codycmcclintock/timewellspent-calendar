# Time Well Spent — shared calendar

This repo hosts `calendar.ics` on **GitHub Pages** so you can **subscribe** and get updates when the file changes on `main`.

**Open the human-friendly link on your phone** (copy URLs from there so nothing gets mangled by Messages):

https://codycmcclintock.github.io/timewellspent-calendar/

## Subscribe URLs (same calendar; pick one per device)

**1. jsDelivr mirror (try this on iPhone if GitHub URLs say “insecure”)** — same file, different TLS stack and `Content-Type: text/calendar`:

https://cdn.jsdelivr.net/gh/codycmcclintock/timewellspent-calendar@main/calendar.ics

**2. GitHub Pages**

https://codycmcclintock.github.io/timewellspent-calendar/calendar.ics

**3. Raw on GitHub**

https://raw.githubusercontent.com/codycmcclintock/timewellspent-calendar/main/calendar.ics

### Apple Calendar

macOS: **File → New Calendar Subscription…** → paste an HTTPS URL from above.

**iPhone (recommended):** **Calendar** app → **Calendars** (bottom) → **Add Calendar** → **Add Subscription Calendar** → paste the full `https://…calendar.ics` URL → **Find** / **Subscribe**.  
Apple documents this flow [here](https://support.apple.com/guide/iphone/iph3d1110d4/ios).

**iPhone (Settings):** **Settings → Calendar → Accounts → Add Calendar → Add Subscribed Calendar**. The first field is labeled **Server** even though you paste a **full URL** — that is expected. **Leave username and password blank.** Keep **SSL on**. If you see **“Cannot connect using SSL”**, do **not** tap **Continue** without SSL (that usually leads to “unable to verify account”). **Cancel**, then try the **jsDelivr** URL instead.

If iPhone still says **“Insecure connection”** even with **`https://`**:

1. **Do not use `webcal://`** — on many iPhones it behaves like insecure HTTP. Use **`https://`** only.
2. Use the **jsDelivr** URL (section 1). iOS is picky about some GitHub hosts; the CDN URL is often accepted.
3. In **Safari**, open the `https://` link: you must see a **lock** and text starting with `BEGIN:VCALENDAR`. If Safari warns about certificates, fix **VPN / captive Wi‑Fi / wrong date & time** on the phone — Calendar will fail the same way.
4. **Nuclear option:** In **Google Calendar** on the web → **Settings → Add calendar → From URL** → paste any HTTPS URL above → add her **Google account** on the iPhone and turn on that calendar. Google’s servers fetch the feed; the iPhone only talks to Google.

The hosted file includes **`VTIMEZONE` for `America/Los_Angeles`**.

### Google Calendar

**Settings → Add calendar → From URL** → paste the HTTPS URL.

## How we edit this

1. Edit `calendar.ics` on `main` (GitHub web editor, or clone and push).
2. For existing events, **keep the same `UID:`**; bump `DTSTAMP:` when you change an event so clients notice updates.
3. After push, calendar apps refresh on their own schedule (often not instant).

## Collaborators

Add people with **Write** access under **Settings → Collaborators** so they can edit the file too.

Repo settings (invite UI): https://github.com/codycmcclintock/timewellspent-calendar/settings/access

From a machine with GitHub CLI, you can invite someone by GitHub username (they still need to accept the email/GitHub invite):

```bash
gh api --method PUT "repos/codycmcclintock/timewellspent-calendar/collaborators/PARTNER_USERNAME" -f permission=push
```

## Next steps (manual)

1. **Subscribe** on each phone using one of the URLs above (same URL on both devices).
2. **Invite your partner** with write access using the settings link or `gh` command (replace `PARTNER_USERNAME`).
