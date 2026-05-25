import type { CalendarEvent } from "@/lib/types";
import { isDriveEvent } from "@/lib/infer-event-category";

export function ItineraryDayStats({ events }: { events: CalendarEvent[] }) {
  const drives = events.filter((e) => isDriveEvent(e.title, e.category));
  let totalMin = 0;
  let totalMi = 0;

  for (const d of drives) {
    if (d.driving_duration_min) totalMin += Number(d.driving_duration_min);
    if (d.driving_distance_mi) totalMi += Number(d.driving_distance_mi);
  }

  const activityCount = events.filter(
    (e) => !isDriveEvent(e.title, e.category),
  ).length;

  if (activityCount === 0 && drives.length === 0) return null;

  const driveLabel =
    totalMin > 0 || totalMi > 0
      ? [
          totalMin >= 60
            ? `${Math.floor(totalMin / 60)} hr ${totalMin % 60} min`
            : totalMin > 0
              ? `${totalMin} min`
              : null,
          totalMi > 0 ? `${totalMi.toFixed(totalMi % 1 === 0 ? 0 : 1)} mi` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span>
        {activityCount} stop{activityCount === 1 ? "" : "s"}
      </span>
      {driveLabel ? <span>{driveLabel} driving</span> : null}
    </div>
  );
}
