"use client";

import { useMemo, useState } from "react";
import { parseISO, isBefore, startOfDay } from "date-fns";
import type { Plan } from "@/lib/types";
import { PlanCreateCard } from "@/components/plans/PlanCreateCard";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import { HowItWorksPlans } from "@/components/plans/HowItWorksPlans";
import { PlanCard } from "@/components/PlanCard";
import Image from "next/image";

export function PlansHub({
  plans,
  unsortedCounts,
  hasPartner,
}: {
  plans: Plan[];
  unsortedCounts: Record<string, number>;
  hasPartner: boolean;
}) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const today = startOfDay(new Date());

  const { upcoming, past } = useMemo(() => {
    const up: Plan[] = [];
    const pa: Plan[] = [];
    for (const p of plans) {
      const end = p.ends_on ? parseISO(p.ends_on) : null;
      if (end && isBefore(end, today)) pa.push(p);
      else up.push(p);
    }
    return { upcoming: up, past: pa };
  }, [plans, today]);

  const list = tab === "upcoming" ? upcoming : past;
  const isEmpty = plans.length === 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Plans</h2>
          <p className="mt-1 text-sm text-muted">
            Trips built from links, reels, and ideas.
          </p>
        </div>
        <HowItWorksPlans />
      </div>

      <div className="mt-5">
        <LinkIngestBar />
      </div>

      <div className="mt-6">
        <PlanCreateCard />
      </div>

      {isEmpty ? (
        <div className="mt-6 rounded-2xl bg-planner px-6 py-10 text-center ring-1 ring-coral/10">
          <Image
            src="/ruffles-logo.png"
            alt=""
            width={56}
            height={56}
            className="mx-auto h-14 w-14 object-contain"
          />
          <p className="mt-4 font-serif text-xl font-semibold text-ink">
            No plans yet
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
            Paste a TikTok or Instagram link above — we&apos;ll open the right city plan. Or
            start one manually.
          </p>
          <div className="mt-6">
            <HowItWorksPlans variant="inline" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === "upcoming" ? "bg-coral text-white" : "bg-card text-muted ring-1 ring-black/5"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setTab("past")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === "past" ? "bg-coral text-white" : "bg-card text-muted ring-1 ring-black/5"
              }`}
            >
              Past
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {list.length === 0 ? (
              <p className="text-center text-sm text-muted py-8">
                No {tab} plans.
              </p>
            ) : (
              list.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  eventCount={unsortedCounts[p.id]}
                  unsortedOnly
                  hasPartner={hasPartner}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
