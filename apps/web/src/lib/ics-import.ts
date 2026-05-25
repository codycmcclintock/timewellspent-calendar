import { readFile } from "fs/promises";
import { join } from "path";
import type { EventScope } from "@/lib/types";

export interface ParsedEvent {
  legacy_uid: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  place_name: string | null;
  address: string | null;
  scope: EventScope;
}

export async function parseCalendarFile(
  filePath: string,
): Promise<ParsedEvent[]> {
  const content = await readFile(filePath, "utf-8");
  const ical = await import("node-ical");
  const parsed = ical.parseICS(content);
  const events: ParsedEvent[] = [];

  for (const key of Object.keys(parsed)) {
    const item = parsed[key];
    if (!item || item.type !== "VEVENT") continue;

    const start = item.start;
    const end = item.end ?? item.start;
    if (!start) continue;

    const uid = item.uid ?? key;
    const location = item.location as string | undefined;

    events.push({
      legacy_uid: String(uid),
      title: String(item.summary ?? "Untitled"),
      description: item.description ? String(item.description) : null,
      starts_at: new Date(start).toISOString(),
      ends_at: new Date(end).toISOString(),
      place_name: location ?? null,
      address: location ?? null,
      scope: "us",
    });
  }

  return events;
}

export function defaultCalendarPath() {
  return join(process.cwd(), "..", "..", "calendar.ics");
}
