import { format, parseISO } from "date-fns";
import type { PlanDayTheme } from "@/lib/types";

export function ItineraryDayHeader({
  day,
  theme,
}: {
  day: string;
  theme: PlanDayTheme | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted">
          {format(parseISO(day), "EEE, MMM d")}
        </p>
        {theme ? (
          <>
            <h2 className="font-serif text-2xl font-semibold text-ink">{theme.title}</h2>
            <p className="text-sm text-muted">{theme.subtitle}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
