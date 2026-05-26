"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { ItineraryDayTabs } from "@/components/itinerary/ItineraryDayTabs";
import { ItineraryDayHeader } from "@/components/itinerary/ItineraryDayHeader";
import { ItineraryDayStats } from "@/components/itinerary/ItineraryDayStats";
import { ItineraryStopCard } from "@/components/itinerary/ItineraryStopCard";
import { ItineraryTravelLeg } from "@/components/itinerary/ItineraryTravelLeg";
import { PlanDayButton } from "@/components/itinerary/PlanDayButton";
import { DayThemeEditor } from "@/components/itinerary/DayThemeEditor";
import { planDayKeys, dayKeyFromIso } from "@/lib/plan-days";
import { dayThemeFor } from "@/lib/joshua-tree-day-themes";
import { isDriveEvent } from "@/lib/infer-event-category";
import { reorderDayEvents } from "@/app/actions";
import type { CalendarEvent, Plan, PlanDayTheme } from "@/lib/types";

export function JoshuaTreeItinerary({
  plan,
  events,
  isPro = false,
  planCount = 0,
}: {
  plan: Plan;
  events: CalendarEvent[];
  isPro?: boolean;
  planCount?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

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

  const dayIndex = days.indexOf(selectedDay);
  const dayNumber = dayIndex >= 0 ? dayIndex + 1 : 1;

  function selectDay(d: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", d);
    router.replace(`/plans/${plan.slug}?${params.toString()}`, { scroll: false });
  }

  function moveEvent(eventId: string, direction: -1 | 1) {
    const stops = dayEvents.filter(
      (e) => !isDriveEvent(e.title, e.category),
    );
    const idx = stops.findIndex((e) => e.id === eventId);
    if (idx < 0) return;
    const swap = idx + direction;
    if (swap < 0 || swap >= stops.length) return;
    const ordered = [...stops];
    [ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]];
    const allIds = dayEvents.map((e) => {
      if (isDriveEvent(e.title, e.category)) return e.id;
      const sIdx = ordered.findIndex((o) => o.id === e.id);
      return sIdx >= 0 ? ordered[sIdx].id : e.id;
    });
    startTransition(async () => {
      await reorderDayEvents(plan.slug, selectedDay, allIds);
      router.refresh();
    });
  }

  let stopNum = 0;

  return (
    <div className="mt-4 px-4 pb-28">
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
        <p className="text-xs text-muted">Day {dayNumber}</p>
        <ItineraryDayHeader day={selectedDay} theme={theme} />
        <DayThemeEditor planId={plan.id} dayKey={selectedDay} theme={theme} />
        <div className="mt-3">
          <PlanDayButton
            planId={plan.id}
            planSlug={plan.slug}
            dayKey={selectedDay}
          />
        </div>
        <div className="mt-2">
          <ItineraryDayStats events={dayEvents} />
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-planner/70 p-3">
        {dayEvents.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-center text-sm leading-relaxed text-muted ring-1 ring-black/5">
            Nothing scheduled this day. Try &ldquo;Plan this day for me&rdquo; above.
          </p>
        ) : (
          dayEvents.map((e, i) => {
            if (isDriveEvent(e.title, e.category)) {
              return <ItineraryTravelLeg key={e.id} event={e} />;
            }
            stopNum += 1;
            const stopsOnly = dayEvents.filter(
              (x) => !isDriveEvent(x.title, x.category),
            );
            const stopIdx = stopsOnly.findIndex((x) => x.id === e.id);
            return (
              <div key={e.id} className="flex gap-1">
                <div className="flex flex-col items-center justify-center gap-0.5 pt-3 text-muted">
                  <GripVertical className="h-4 w-4 opacity-40" aria-hidden />
                  <button
                    type="button"
                    disabled={stopIdx <= 0}
                    onClick={() => moveEvent(e.id, -1)}
                    className="text-[10px] disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={stopIdx >= stopsOnly.length - 1}
                    onClick={() => moveEvent(e.id, 1)}
                    className="text-[10px] disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <ItineraryStopCard
                    event={e}
                    stopNumber={stopNum}
                    planSlug={plan.slug}
                    defaultOpen={i === 0 && stopNum === 1}
                  />
                </div>
              </div>
            );
          })
        )}
        <Link
          href={`/record?mode=trip&plan=${plan.slug}`}
          className="mt-2 flex w-full items-center justify-center rounded-xl border border-dashed border-primary-500/40 py-3 text-sm font-medium text-primary-500"
        >
          + Add to this day
        </Link>
      </div>
    </div>
  );
}
