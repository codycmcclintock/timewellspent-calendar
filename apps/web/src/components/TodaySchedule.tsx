"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDayHeader } from "@/lib/dates";
import { ScheduleActivityCard } from "./ScheduleActivityCard";
import { EventSheet } from "./EventSheet";
import type { CalendarEvent } from "@/lib/types";

export function TodaySchedule({
  initialEvents,
  coupleId,
  userId,
  date,
}: {
  initialEvents: CalendarEvent[];
  coupleId: string;
  userId: string;
  date: Date;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`events-${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `couple_id=eq.${coupleId}`,
        },
        async () => {
          const { start, end } = await import("@/lib/dates").then((d) =>
            d.dayRangeISO(date),
          );
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("couple_id", coupleId)
            .gte("starts_at", start)
            .lte("starts_at", end)
            .order("starts_at");
          if (data) setEvents(data as CalendarEvent[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, date]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Today&apos;s Schedule
          </h2>
          <p className="text-sm text-muted">{formatDayHeader(date)}</p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-black/5">
          <p className="font-medium text-ink">Nothing planned yet</p>
          <p className="mt-1 text-sm text-muted">
            Add something beautiful for today.
          </p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-4 rounded-full bg-blue px-5 py-2 text-sm font-medium text-white"
          >
            Add activity
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <ScheduleActivityCard key={e.id} event={e} userId={userId} />
          ))}
        </div>
      )}

      <EventSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultStart={date}
      />
    </div>
  );
}
