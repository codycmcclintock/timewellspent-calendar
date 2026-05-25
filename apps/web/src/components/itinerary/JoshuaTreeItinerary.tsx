"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ItineraryDayTabs } from "@/components/itinerary/ItineraryDayTabs";
import { ItineraryDayHeader } from "@/components/itinerary/ItineraryDayHeader";
import { ItineraryDayStats } from "@/components/itinerary/ItineraryDayStats";
import { ItineraryStopCard } from "@/components/itinerary/ItineraryStopCard";
import { ItineraryTravelLeg } from "@/components/itinerary/ItineraryTravelLeg";
import { planDayKeys } from "@/lib/plan-days";
import { dayKeyFromIso } from "@/lib/plan-days";
import { dayThemeFor } from "@/lib/joshua-tree-day-themes";
import { isDriveEvent } from "@/lib/infer-event-category";
import type { CalendarEvent, Plan, PlanDayTheme } from "@/lib/types";

export function JoshuaTreeItinerary({
  plan,
  events,
}: {
  plan: Plan;
  events: CalendarEvent[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const days = useMemo(() => planDayKeys(plan), [plan]);

  const selectedDay =
    searchParams.get("day") && days.includes(searchParams.get("day")!)
      ? searchParams.get("day")!
      : days[0] ?? "";

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events
      .filter((e) => dayKeyFromIso(e.starts_at) === selectedDay)
      .sort((a, b) => {
        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (so !== 0) return so;
        return a.starts_at.localeCompare(b.starts_at);
      });
  }, [events, selectedDay]);

  const themes = (plan.day_themes ?? {}) as Record<string, PlanDayTheme>;
  const theme =
    themes[selectedDay] ?? (selectedDay ? dayThemeFor(selectedDay) : null);

  function selectDay(d: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", d);
    router.replace(`/plans/${plan.slug}?${params.toString()}`, { scroll: false });
  }

  const dayIndex = days.indexOf(selectedDay);

  let stopNum = 0;

  return (
    <div className="mt-5 px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={dayIndex <= 0}
          onClick={() => selectDay(days[dayIndex - 1])}
          className="rounded-full p-2 text-muted disabled:opacity-30"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <ItineraryDayTabs days={days} selectedDay={selectedDay} onSelect={selectDay} />
        </div>
        <button
          type="button"
          disabled={dayIndex >= days.length - 1}
          onClick={() => selectDay(days[dayIndex + 1])}
          className="rounded-full p-2 text-muted disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4">
        <ItineraryDayHeader day={selectedDay} theme={theme} />
        <div className="mt-2">
          <ItineraryDayStats events={dayEvents} />
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-planner/70 p-3 pb-6">
        {dayEvents.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-center text-sm text-muted ring-1 ring-black/5">
            Nothing scheduled this day.
          </p>
        ) : (
          dayEvents.map((e, i) => {
            if (isDriveEvent(e.title, e.category)) {
              return <ItineraryTravelLeg key={e.id} event={e} />;
            }
            stopNum += 1;
            return (
              <ItineraryStopCard
                key={e.id}
                event={e}
                stopNumber={stopNum}
                defaultOpen={i === 0 && stopNum === 1}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
