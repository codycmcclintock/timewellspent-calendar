"use client";

import { addDays, format, isSameDay } from "date-fns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { formatTime, WEEKDAY_COLUMNS } from "@/lib/dates";
import { EventSheet } from "./EventSheet";
import type { CalendarEvent } from "@/lib/types";

function eventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((e) => isSameDay(new Date(e.starts_at), day));
}

export function WeekGrid({
  weekStart,
  events,
  userId,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  userId: string;
}) {
  const [sheetDay, setSheetDay] = useState<Date | null>(null);

  function renderDay(dayOffset: number) {
    const day = addDays(weekStart, dayOffset);
    const dayEvents = eventsForDay(events, day);
    const label = format(day, "EEEE").toUpperCase();

    return (
      <div key={dayOffset} className="min-h-[200px]">
        <div className="border-b-2 border-ink pb-1">
          <h3 className="text-xs font-bold tracking-wide text-ink">{label}</h3>
          <p className="text-xs text-muted">{format(day, "MMM d")}</p>
        </div>
        <ul className="mt-2 space-y-2">
          {dayEvents.map((e) => (
            <li key={e.id}>
              <Link
                href={`/day/${format(day, "yyyy-MM-dd")}?event=${e.id}`}
                className="block rounded-lg border border-black/5 bg-card px-2 py-2 hover:bg-white"
              >
                <span className="text-xs font-bold text-ink">
                  {formatTime(e.starts_at)}
                </span>
                <p className="text-sm font-medium leading-tight">{e.title}</p>
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setSheetDay(day)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-planner p-4 ring-1 ring-black/5">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-serif text-2xl font-semibold text-ink">WEEKLY PLAN</h2>
        <p className="text-xs text-muted">WEEK</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          {WEEKDAY_COLUMNS.left.map((d) => renderDay(d - 1))}
        </div>
        <div className="space-y-6">
          {WEEKDAY_COLUMNS.right.map((d) => renderDay(d - 1))}
        </div>
      </div>
      <div className="mt-6 border-t-2 border-ink pt-4">
        {renderDay(6)}
      </div>
      {sheetDay && (
        <EventSheet
          open
          onClose={() => setSheetDay(null)}
          defaultStart={sheetDay}
        />
      )}
    </div>
  );
}
