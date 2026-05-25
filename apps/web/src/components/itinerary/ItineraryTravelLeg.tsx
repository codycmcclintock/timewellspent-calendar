import type { CalendarEvent } from "@/lib/types";

export function ItineraryTravelLeg({ event }: { event: CalendarEvent }) {
  const label =
    event.hours_label ??
    event.description?.split("\n")[0]?.slice(0, 80) ??
    event.title;

  return (
    <div className="flex items-center gap-2 py-2 pl-1">
      <span className="h-px flex-1 bg-coral/20" />
      <p className="shrink-0 text-center text-xs text-muted">
        <span className="mr-1" aria-hidden>
          🚗
        </span>
        {label}
      </p>
      <span className="h-px flex-1 bg-coral/20" />
    </div>
  );
}
