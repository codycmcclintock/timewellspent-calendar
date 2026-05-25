"use client";

import { format, parseISO } from "date-fns";
import { ScheduleActivityCard } from "@/components/ScheduleActivityCard";
import type { CalendarEvent } from "@/lib/types";

function dayKey(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}

function dayLabel(iso: string) {
  return format(parseISO(iso), "EEEE, MMM d");
}

export function TripDayTimeline({
  events,
  userId,
}: {
  events: CalendarEvent[];
  userId: string;
}) {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = dayKey(e.starts_at);
    const list = byDay.get(key) ?? [];
    list.push(e);
    byDay.set(key, list);
  }

  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (days.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-8 text-center text-sm text-muted ring-1 ring-black/5">
        No activities yet — speak your trip or import the calendar below.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {days.map(([key, dayEvents]) => (
        <section key={key}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="font-serif text-xl font-semibold text-ink">
              {dayLabel(dayEvents[0].starts_at)}
            </h3>
            <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-medium text-coral">
              {dayEvents.length} {dayEvents.length === 1 ? "stop" : "stops"}
            </span>
          </div>
          <div className="space-y-3 border-l-2 border-[#b85c38]/30 pl-4">
            {dayEvents.map((e, i) => (
              <ScheduleActivityCard
                key={e.id}
                event={e}
                userId={userId}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
