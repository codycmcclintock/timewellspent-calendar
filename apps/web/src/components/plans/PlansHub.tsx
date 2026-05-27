"use client";

import { useMemo, useState } from "react";
import { parseISO, isBefore, startOfDay } from "date-fns";
import { HelpCircle } from "lucide-react";
import type { Plan } from "@/lib/types";
import { PlanCreateCard } from "@/components/plans/PlanCreateCard";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import { isLinkIngestEnabled } from "@/lib/feature-flags";
import { PlansEmptyState } from "@/components/plans/PlansEmptyState";
import { PlanCard } from "@/components/PlanCard";

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
  const [helpOpen, setHelpOpen] = useState(false);
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Plans</h2>
          <p className="mt-1 text-sm text-muted">
            Trips built from links, reels, and ideas.
          </p>
        </div>
        {isEmpty ? (
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
            aria-label="How plans work"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {isLinkIngestEnabled() ? (
        <div className="mt-5">
          <LinkIngestBar placeholder="Paste a TikTok or Instagram link…" />
        </div>
      ) : null}

      {!isEmpty ? (
        <div className="mt-6">
          <PlanCreateCard />
        </div>
      ) : null}

      {isEmpty ? (
        <PlansEmptyState
          helpOpen={helpOpen}
          onHelpClose={() => setHelpOpen(false)}
        />
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === "upcoming"
                  ? "bg-coral text-white"
                  : "bg-card text-muted ring-1 ring-black/5"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setTab("past")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === "past"
                  ? "bg-coral text-white"
                  : "bg-card text-muted ring-1 ring-black/5"
              }`}
            >
              Past
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {list.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
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
