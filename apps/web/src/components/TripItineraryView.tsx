"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Mic, ChevronDown } from "lucide-react";
import { JoshuaTreeItinerary } from "@/components/itinerary/JoshuaTreeItinerary";
import { TripPlannerPanel } from "@/components/TripPlannerPanel";
import { PartnerInviteBanner } from "@/components/PartnerInviteBanner";
import { planDayKeys } from "@/lib/plan-days";
import type { CalendarEvent, Plan } from "@/lib/types";

export function TripItineraryView({
  plan,
  events,
  inviteUrl,
  showPartnerInvite,
}: {
  plan: Plan;
  events: CalendarEvent[];
  inviteUrl?: string;
  showPartnerInvite?: boolean;
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
    <div className="-mx-4">
      <div
        className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-terracotta/25 via-coral/15 to-planner px-4 pb-6 pt-2 text-center"
        style={
          plan.cover_image_url
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(247,244,239,0.85), rgba(247,244,239,0.95)), url(${plan.cover_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-coral">
          Ruffles trip
        </p>
        <h1 className="font-serif text-3xl font-semibold text-ink">{plan.title}</h1>
        {dateRange ? (
          <p className="mt-1 text-sm text-muted">{dateRange}</p>
        ) : null}
        {hasItinerary ? (
          <p className="mt-2 text-xs font-medium text-coral">
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
        <JoshuaTreeItinerary plan={plan} events={events} />
      ) : (
        <div className="mx-4 mt-6 space-y-4">
          <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-black/5">
            <p className="font-serif text-lg font-semibold text-ink">No itinerary yet</p>
            <p className="mt-2 text-sm text-muted">
              Import the Joshua Tree calendar to see every stop, drive leg, and day theme.
            </p>
          </div>
          <TripPlannerPanel hasEvents={false} />
        </div>
      )}

      <div className="space-y-2 px-4 pb-8 pt-4">
        <Link
          href={`/record?mode=trip&plan=${plan.slug}`}
          className="flex items-center justify-center gap-2 rounded-full border-2 border-coral py-3 text-sm font-semibold text-coral"
        >
          <Mic className="h-4 w-4" />
          Talk through the trip
        </Link>
        {hasItinerary ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
