import { ExternalLink } from "lucide-react";
import { mapsDirectionsUrl } from "@/lib/maps-url";
import type { CalendarEvent } from "@/lib/types";

export function ItineraryTravelLeg({ event }: { event: CalendarEvent }) {
  const label =
    event.hours_label ??
    event.description?.split("\n")[0]?.slice(0, 80) ??
    event.title;
  const mapsUrl = mapsDirectionsUrl(event.address, event.place_name);
  const duration =
    event.driving_duration_min != null
      ? `${event.driving_duration_min} min`
      : null;
  const distance =
    event.driving_distance_mi != null
      ? `${event.driving_distance_mi} mi`
      : null;
  const meta = [duration, distance].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-2 py-2 pl-1">
      <span className="h-px flex-1 bg-primary-500/20" />
      <p className="shrink-0 text-center text-xs text-muted">
        <span className="mr-1" aria-hidden>
          🚗
        </span>
        {meta ? `${meta} · ` : ""}
        {label}
        {mapsUrl ? (
          <>
            {" "}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-primary-500"
            >
              Open in Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </>
        ) : null}
      </p>
      <span className="h-px flex-1 bg-primary-500/20" />
    </div>
  );
}
