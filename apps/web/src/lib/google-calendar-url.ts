import type { CalendarEvent } from "@/lib/types";

export function googleCalendarAddUrl(event: CalendarEvent): string {
  const start = event.starts_at.replace(/[-:]/g, "").replace(/\.\d{3}/, "").slice(0, 15);
  const end = event.ends_at.replace(/[-:]/g, "").replace(/\.\d{3}/, "").slice(0, 15);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}Z/${end}Z`,
    details: event.description ?? "",
    location: event.address ?? event.place_name ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
