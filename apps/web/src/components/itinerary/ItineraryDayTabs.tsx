"use client";

import { format, parseISO } from "date-fns";

export function ItineraryDayTabs({
  days,
  selectedDay,
  onSelect,
}: {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const active = d === selectedDay;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs transition ${
              active
                ? "bg-coral text-white shadow-sm"
                : "bg-card text-muted ring-1 ring-black/5"
            }`}
          >
            <span className="block font-semibold">{format(parseISO(d), "EEE")}</span>
            <span className={active ? "text-white/85" : ""}>
              {format(parseISO(d), "MMM d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
