"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import { UnsortedDraftCard } from "@/components/plans/UnsortedDraftCard";
import { PlanSettingsSheet } from "@/components/plans/PlanSettingsSheet";
import { SmartPlanButton } from "@/components/plans/SmartPlanButton";
import { TripEventCard, TripDriveChip } from "@/components/TripEventCard";
import { dayThemeFor } from "@/lib/joshua-tree-day-themes";
import { isDriveEvent } from "@/lib/infer-event-category";
import type { CalendarEvent, Draft, Plan, PlanDayTheme } from "@/lib/types";

function dayKey(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}

function dateSummary(plan: Plan) {
  if (plan.date_mode === "exact" && plan.starts_on) {
    const s = format(parseISO(plan.starts_on), "MMM d");
    const e = plan.ends_on ? format(parseISO(plan.ends_on), "MMM d, yyyy") : "";
    return e ? `${s}–${e}` : s;
  }
  if (plan.flexible_month) {
    return `${format(parseISO(`${plan.flexible_month}-01`), "MMMM yyyy")} · ${plan.trip_length_days ?? 3} days`;
  }
  return `${plan.trip_length_days ?? 3} days · dates flexible`;
}

export function PlanWishlistView({
  plan,
  drafts,
  events,
  inviteUrl,
  showPartnerInvite,
  isPro,
  planCount = 0,
}: {
  plan: Plan;
  drafts: Draft[];
  events: CalendarEvent[];
  inviteUrl?: string;
  showPartnerInvite: boolean;
  isPro: boolean;
  planCount?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const unsorted = drafts.filter((d) => !d.suggested_day);
  const scheduled = drafts.filter((d) => d.suggested_day);

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

  function selectDay(d: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("day", d);
    router.replace(`/plans/${plan.slug}?${params.toString()}`, { scroll: false });
  }

  const dayIndex = selectedDay ? days.indexOf(selectedDay) : 0;
  const showTimeline = plan.status === "scheduled" && events.length > 0;

  return (
    <div className="-mx-4">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary-500/12 via-planner to-shell px-4 pb-6 pt-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral">
          {plan.status === "building" ? "Building your trip" : "Scheduled"}
        </p>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {plan.destination ?? plan.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{dateSummary(plan)}</p>
        <p className="mt-2 text-xs font-medium text-coral">
          {unsorted.length} unsorted · {scheduled.length + events.length} placed
        </p>
        <div className="mt-4 flex justify-center">
          <PlanSettingsSheet
            plan={plan}
            inviteUrl={inviteUrl}
            showPartnerInvite={showPartnerInvite}
          />
        </div>
      </div>

      <div className="mt-5 px-4">
        <LinkIngestBar planId={plan.id} placeholder="Add Instagram or TikTok to this trip…" />
      </div>

      <section className="mt-6 px-4">
        <h2 className="font-serif text-lg font-semibold text-ink">Unsorted</h2>
        <p className="text-sm text-muted">
          Reels and links land here until you Smart Plan or schedule them.
        </p>
        {unsorted.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-card p-6 text-center text-sm text-muted ring-1 ring-black/5">
            Paste a link above — we&apos;ll add it to this trip.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unsorted.map((d) => (
              <li key={d.id}>
                <UnsortedDraftCard draft={d} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <SmartPlanButton
            planId={plan.id}
            disabled={unsorted.length === 0}
          />
        </div>
      </section>

      {showTimeline ? (
        <>
          <div className="mt-8 flex items-center gap-2 px-4">
            <button
              type="button"
              disabled={dayIndex <= 0}
              onClick={() => selectDay(days[dayIndex - 1])}
              className="rounded-full p-2 text-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs ${
                    d === selectedDay
                      ? "bg-coral text-white"
                      : "bg-card text-muted ring-1 ring-black/5"
                  }`}
                >
                  <span className="block font-semibold">{format(parseISO(d), "EEE")}</span>
                  <span>{format(parseISO(d), "MMM d")}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={dayIndex >= days.length - 1}
              onClick={() => selectDay(days[dayIndex + 1])}
              className="rounded-full p-2 text-muted disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {theme ? (
            <div className="mt-4 px-4">
              <h2 className="font-serif text-2xl font-semibold">{theme.title}</h2>
              <p className="text-sm text-muted">{theme.subtitle}</p>
            </div>
          ) : null}
          <div className="mt-4 space-y-2 bg-planner/60 px-4 py-4 pb-8">
            {dayEvents.map((e, i) =>
              isDriveEvent(e.title, e.category) ? (
                <TripDriveChip key={e.id} event={e} />
              ) : (
                <TripEventCard key={e.id} event={e} defaultOpen={i === 0} />
              ),
            )}
          </div>
        </>
      ) : null}

      <div className="px-4 pb-8">
        <Link
          href={`/record?mode=trip&plan=${plan.slug}`}
          className="flex items-center justify-center gap-2 rounded-full border border-coral/40 py-3 text-sm font-semibold text-coral"
        >
          <Mic className="h-4 w-4" />
          Talk through the trip
        </Link>
      </div>
    </div>
  );
}
