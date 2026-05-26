"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown } from "lucide-react";
import { TripPageShell } from "@/components/itinerary/TripPageShell";
import { JoshuaTreeItinerary } from "@/components/itinerary/JoshuaTreeItinerary";
import { TripFab } from "@/components/itinerary/TripFab";
import { TripPlannerPanel } from "@/components/TripPlannerPanel";
import { PartnerInviteBanner } from "@/components/PartnerInviteBanner";
import { planDayKeys } from "@/lib/plan-days";
import type { CalendarEvent, Plan } from "@/lib/types";

export function TripItineraryView({
  plan,
  events,
  inviteUrl,
  showPartnerInvite,
  isPro = false,
  planCount = 0,
}: {
  plan: Plan;
  events: CalendarEvent[];
  inviteUrl?: string;
  showPartnerInvite?: boolean;
  isPro?: boolean;
  planCount?: number;
}) {
  const [showAdvanced, setShowAdvanced] = useState(events.length === 0);

  const planDays = planDayKeys(plan);
  const dateRange =
    plan.starts_on && plan.ends_on
      ? `${format(parseISO(plan.starts_on), "MMM d")}–${format(parseISO(plan.ends_on), "MMM d, yyyy")}`
      : planDays.length >= 2
        ? `${format(parseISO(planDays[0]), "MMM d")}–${format(parseISO(planDays[planDays.length - 1]), "MMM d, yyyy")}`
        : "";

  const hasItinerary = events.length > 0;

  return (
    <TripPageShell plan={plan}>
      <div
        className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-primary-700/20 via-primary-500/10 to-planner px-4 pb-5 pt-2 text-center"
        style={
          plan.cover_image_url
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(250,247,242,0.88), rgba(250,247,242,0.96)), url(${plan.cover_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-500">
          Ruffles trip
        </p>
        {dateRange ? (
          <p className="mt-1 text-sm text-muted">{dateRange}</p>
        ) : null}
        {hasItinerary ? (
          <p className="mt-2 text-xs font-medium text-primary-500">
            {events.length} moments planned
          </p>
        ) : null}
      </div>

      {showPartnerInvite && inviteUrl ? (
        <div className="mt-4 px-4">
          <PartnerInviteBanner inviteUrl={inviteUrl} variant="slim" />
        </div>
      ) : null}

      {hasItinerary ? (
        <>
          <JoshuaTreeItinerary
            plan={plan}
            events={events}
            isPro={isPro}
            planCount={planCount}
          />
          <TripFab planSlug={plan.slug} />
        </>
      ) : (
        <div className="mx-4 mt-6 space-y-4">
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-black/5">
            <p className="font-serif text-lg font-semibold text-ink">
              Nothing planned yet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              What&apos;s something you&apos;ve been wanting to do together? Talk
              it through or import your calendar.
            </p>
          </div>
          <TripPlannerPanel hasEvents={false} />
        </div>
      )}

      {hasItinerary ? (
        <div className="space-y-2 px-4 pb-8">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-center gap-1 text-xs text-muted"
          >
            More — import &amp; advanced
            <ChevronDown
              className={`h-3.5 w-3.5 transition ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>
          {showAdvanced ? (
            <div className="mt-1">
              <TripPlannerPanel hasEvents />
            </div>
          ) : null}
        </div>
      ) : null}
    </TripPageShell>
  );
}
