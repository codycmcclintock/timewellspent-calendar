import { readFile } from "fs/promises";
import { join } from "path";
import { inferEventCategory, isDriveEvent } from "@/lib/infer-event-category";
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
  category: string;
  hours_label: string | null;
  notes: string | null;
  bring_items: string[];
}

function parseDescription(raw: string | null): {
  description: string | null;
  bring_items: string[];
  notes: string | null;
} {
  if (!raw) return { description: null, bring_items: [], notes: null };

  const lines = raw.split(/\\n|\n/).map((l) => l.trim()).filter(Boolean);
  const bring: string[] = [];
  const body: string[] = [];
  let inBring = false;

  for (const line of lines) {
    if (/^bring\/wear|^bring:|^pack /i.test(line)) {
      inBring = true;
      continue;
    }
    if (inBring && /^[-•*]/.test(line)) {
      bring.push(line.replace(/^[-•*]\s*/, ""));
      continue;
    }
    if (inBring && line.length < 60 && !line.endsWith(".")) {
      bring.push(line);
      continue;
    }
    inBring = false;
    body.push(line);
  }

  const description = body.join("\n\n") || raw;
  return {
    description,
    bring_items: bring,
    notes: bring.length ? null : null,
  };
}

function hoursFromTitle(title: string, description: string | null): string | null {
  const m = `${title} ${description ?? ""}`.match(
    /(\d+(?:\.\d+)?)\s*(?:mi|mile|hr|hour|min)/i,
  );
  if (m) return m[0];
  if (/\b1 mi\b/i.test(title)) return "1 mi";
  if (/quick/i.test(description ?? "")) return "Quick";
  return null;
}

function enrichEvent(
  title: string,
  description: string | null,
  location: string | null,
): Pick<ParsedEvent, "description" | "bring_items" | "notes" | "category" | "hours_label"> {
  const parsed = parseDescription(description);
  const category = inferEventCategory(title, parsed.description);
  const hours_label =
    isDriveEvent(title, category) && parsed.description
      ? parsed.description.split("\n")[0]?.slice(0, 80) ?? null
      : hoursFromTitle(title, parsed.description);

  return {
    ...parsed,
    category,
    hours_label,
  };
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
    const title = String(item.summary ?? "Untitled");
    const rawDesc = item.description ? String(item.description) : null;
    const enriched = enrichEvent(title, rawDesc, location ?? null);

    events.push({
      legacy_uid: String(uid),
      title,
      starts_at: new Date(start).toISOString(),
      ends_at: new Date(end).toISOString(),
      place_name: location ?? null,
      address: location ?? null,
      scope: "us",
      ...enriched,
    });
  }

  return events;
}

export function defaultCalendarPath() {
  return join(process.cwd(), "public", "calendar.ics");
}

export function fallbackCalendarPath() {
  return join(process.cwd(), "..", "..", "calendar.ics");
}
