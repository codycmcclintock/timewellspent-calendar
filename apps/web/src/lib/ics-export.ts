import ical from "ical-generator";
import type { CalendarEvent } from "@/lib/types";

const DISPLAY_TZ = "America/Los_Angeles";

export function buildUserFeed(
  events: CalendarEvent[],
  viewerId: string,
  calendarName: string,
) {
  const cal = ical({ name: calendarName });
  cal.timezone({ name: DISPLAY_TZ });

  for (const e of events) {
    const uid = e.legacy_uid ?? `${e.id}@ruffles`;
    const loc = e.address ?? e.place_name ?? undefined;
    const descParts = [e.description, e.notes].filter(Boolean);
    if (e.cost_is_free) descParts.push("Cost: Free");
    else if (e.cost_cents) descParts.push(`Cost: $${(e.cost_cents / 100).toFixed(2)}`);
    if (e.hours_label) descParts.push(`Hours: ${e.hours_label}`);

    cal.createEvent({
      id: uid,
      start: new Date(e.starts_at),
      end: new Date(e.ends_at),
      summary: e.title,
      description: descParts.join("\n\n"),
      location: loc,
      timezone: DISPLAY_TZ,
      stamp: new Date(e.updated_at),
    });
  }

  return cal.toString();
}

export function filterEventsForFeed(
  events: CalendarEvent[],
  viewerId: string,
  partnerId: string | null,
): CalendarEvent[] {
  return events.filter((e) => {
    if (e.scope === "us") return true;
    if (e.created_by === viewerId) return true;
    if (partnerId && e.created_by === partnerId) return true;
    return false;
  });
}

export function feedUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/feed/${token}.ics`;
}
