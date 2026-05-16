# Time Well Spent — shared calendar

This repo hosts a single ICS file on **GitHub Pages** so you can **subscribe** (not just import once) and get updates when `calendar.ics` changes on `main`.

## Subscribe (pick one URL and stick with it)

**GitHub Pages (preferred if it works in your app):**

https://codycmcclintock.github.io/timewellspent-calendar/calendar.ics

**Raw file on GitHub (fallback if your client is picky about content type):**

https://raw.githubusercontent.com/codycmcclintock/timewellspent-calendar/main/calendar.ics

### Apple Calendar

macOS: **File → New Calendar Subscription…** → paste the HTTPS URL.

iOS: **Settings → Calendar → Accounts → Add Subscribed Calendar** → paste the URL.

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
