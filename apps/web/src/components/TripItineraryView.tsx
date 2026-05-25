"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { TripEventCard, TripDriveChip } from "@/components/TripEventCard";
import { SharedCalendarBlock } from "@/components/SharedCalendarBlock";
import { TripPlannerPanel } from "@/components/TripPlannerPanel";
import { dayThemeFor } from "@/lib/joshua-tree-day-themes";
import { isDriveEvent } from "@/lib/infer-event-category";
import type { CalendarEvent, Plan, PlanDayTheme } from "@/lib/types";

function dayKey(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}

export function TripItineraryView({
  plan,
  events,
  feedUrl,
}: {
  plan: Plan;
  events: CalendarEvent[];
  feedUrl: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandAll, setExpandAll] = useState(false);
  const [showImport, setShowImport] = useState(events.length === 0);

  const days = useMemo(() => {
    const keys = new Set<string>();
    for (const e of events) keys.add(dayKey(e.starts_at));
    return [...keys].sort();
  }, [events]);

  const selectedDay =
    searchParams.get("day") && days.includes(searchParams.get("day")!)
      ? searchParams.get("day")!
      : days[0] ?? null;

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events
      .filter((e) => dayKey(e.starts_at) === selectedDay)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [events, selectedDay]);

  const themes = (plan.day_themes ?? {}) as Record<string, PlanDayTheme>;
  const theme =
    themes[selectedDay ?? ""] ??
    (selectedDay ? dayThemeFor(selectedDay) : null);

  const dateRange =
    plan.starts_on && plan.ends_on
      ? `${format(parseISO(plan.starts_on), "MMM d")}–${format(parseISO(plan.ends_on), "MMM d, yyyy")}`
      : days.length >= 2
        ? `${format(parseISO(days[0]), "MMM d")}–${format(parseISO(days[days.length - 1]), "MMM d, yyyy")}`
        : "";

  function selectDay(d: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", d);
    router.replace(`/plans/${plan.slug}?${params.toString()}`, { scroll: false });
  }

  const dayIndex = selectedDay ? days.indexOf(selectedDay) : 0;

  return (
    <div className="-mx-4">
      <div className="px-4 pb-2 pt-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
          Time well spent ❤️
        </p>
        <h1 className="font-serif text-3xl font-semibold text-ink">{plan.title}</h1>
        {dateRange ? (
          <p className="mt-1 text-sm text-muted">{dateRange}</p>
        ) : null}
      </div>

      <div className="px-4">
        <SharedCalendarBlock feedUrl={feedUrl} eventCount={events.length} />
      </div>

      <div className="mt-6 px-4">
        <Link
          href={`/record?mode=trip&plan=${plan.slug}`}
          className="flex items-center justify-center gap-2 rounded-full bg-[#2563eb] py-3 text-sm font-semibold text-white shadow-md"
        >
          <Mic className="h-4 w-4" />
          Talk through the trip
        </Link>
        <button
          type="button"
          onClick={() => setShowImport(!showImport)}
          className="mt-2 w-full text-center text-xs text-muted underline"
        >
          {showImport ? "Hide import options" : "Import or re-plan"}
        </button>
        {showImport ? (
          <div className="mt-3">
            <TripPlannerPanel hasEvents={events.length > 0} />
          </div>
        ) : null}
      </div>

      {days.length > 0 ? (
        <>
          <div className="mt-6 flex items-center gap-2 px-4">
            <button
              type="button"
              disabled={dayIndex <= 0}
              onClick={() => selectDay(days[dayIndex - 1])}
              className="rounded-full p-2 text-muted disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
              {days.map((d) => {
                const active = d === selectedDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => selectDay(d)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs transition ${
                      active
                        ? "bg-ink text-white"
                        : "bg-card text-muted ring-1 ring-black/5"
                    }`}
                  >
                    <span className="block font-semibold">
                      {format(parseISO(d), "EEE")}
                    </span>
                    <span className={active ? "text-white/80" : ""}>
                      {format(parseISO(d), "MMM d")}
                    </span>
                  </button>
                );
              })}
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

          {theme ? (
            <div className="mt-4 flex items-end justify-between gap-3 px-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  {theme.title}
                </h2>
                <p className="text-sm text-muted">{theme.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">{dayEvents.length} events</p>
                <button
                  type="button"
                  onClick={() => setExpandAll(!expandAll)}
                  className="text-xs font-medium text-[#2563eb]"
                >
                  {expandAll ? "Collapse all" : "Expand all"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-2 px-4 pb-8">
            {dayEvents.length === 0 ? (
              <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted ring-1 ring-black/5">
                No events this day — import the calendar or use voice planning.
              </p>
            ) : (
              dayEvents.map((e, i) => {
                if (isDriveEvent(e.title, e.category)) {
                  return <TripDriveChip key={e.id} event={e} />;
                }
                return (
                  <TripEventCard
                    key={e.id}
                    event={e}
                    defaultOpen={expandAll || i === 0}
                  />
                );
              })
            )}
          </div>
        </>
      ) : (
        <p className="mx-4 mt-6 rounded-2xl bg-card p-8 text-center text-sm text-muted ring-1 ring-black/5">
          No itinerary yet. Tap &quot;Talk through the trip&quot; or import below.
        </p>
      )}
    </div>
  );
}
