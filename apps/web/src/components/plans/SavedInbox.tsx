"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assignDraftToPlan } from "@/app/actions";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import { ProUpgradeSheet } from "@/components/plans/ProUpgradeSheet";
import {
  categorizeStrayDraft,
  strayDestinationLabel,
} from "@/lib/inbox-strays";
import { destinationKeyFromLabel } from "@/lib/plan-utils";
import { FREE_INBOX_REEL_SAVES_PER_MONTH } from "@/lib/pricing";
import type { Draft, Plan } from "@/lib/types";

function StrayDraftRow({
  draft,
  plans,
}: {
  draft: Draft;
  plans: Plan[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const category = categorizeStrayDraft(draft);
  const destLabel = strayDestinationLabel(draft);
  const destKey = destinationKeyFromLabel(destLabel);
  const matchingPlans = plans.filter(
    (p) =>
      p.destination_key === destKey ||
      p.destination?.toLowerCase() === destLabel.toLowerCase(),
  );

  return (
    <li className="rounded-xl bg-card px-4 py-3 ring-1 ring-black/5">
      <p className="text-xs font-medium text-primary-500">{destLabel}</p>
      <p className="font-medium text-ink">{draft.title ?? "Untitled"}</p>
      {draft.place_name ? (
        <p className="mt-0.5 text-xs text-muted">{draft.place_name}</p>
      ) : null}
      {draft.source_url ? (
        <p className="mt-1 truncate text-xs text-muted">{draft.source_url}</p>
      ) : null}

      {category === "need_trip" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/plans/new?destination=${encodeURIComponent(destLabel)}`}
            className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white"
          >
            Start {destLabel} trip
          </Link>
          {matchingPlans.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await assignDraftToPlan(draft.id, p.id);
                  router.refresh();
                })
              }
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
            >
              Add to {p.destination ?? p.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">
          We couldn&apos;t pin a place — edit or save again with a clearer link.
        </p>
      )}
    </li>
  );
}

export function SavedInbox({
  drafts,
  plans,
  inboxSavesThisMonth,
  isPro,
}: {
  drafts: Draft[];
  plans: Plan[];
  inboxSavesThisMonth: number;
  isPro: boolean;
}) {
  const [showPro, setShowPro] = useState(false);

  const inbox = useMemo(
    () => drafts.filter((d) => !d.plan_id && d.source_url),
    [drafts],
  );

  const { needTrip, noLocation } = useMemo(() => {
    const need: Draft[] = [];
    const none: Draft[] = [];
    for (const d of inbox) {
      if (categorizeStrayDraft(d) === "need_trip") need.push(d);
      else none.push(d);
    }
    return { needTrip: need, noLocation: none };
  }, [inbox]);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">Inbox</h3>
        <p className="text-sm text-muted">
          Strays only — reels we couldn&apos;t match to a trip. Saves with a known
          destination go straight to that trip.
        </p>
        {!isPro ? (
          <p className="mt-1 text-xs text-primary-600">
            {inboxSavesThisMonth}/{FREE_INBOX_REEL_SAVES_PER_MONTH} inbox saves
            this month
          </p>
        ) : null}
      </div>

      <LinkIngestBar
        forceInbox
        onLimitReached={() => setShowPro(true)}
      />

      {inbox.length === 0 ? (
        <p className="rounded-xl bg-planner/80 px-4 py-6 text-center text-sm text-muted">
          Nothing here — that&apos;s good. Reels with a clear destination land on
          your trips automatically.
        </p>
      ) : (
        <div className="space-y-6">
          {needTrip.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Need a trip
              </h4>
              <p className="mt-0.5 text-xs text-muted">
                We know where — start a trip or add to an existing one.
              </p>
              <ul className="mt-2 space-y-2">
                {needTrip.map((d) => (
                  <StrayDraftRow key={d.id} draft={d} plans={plans} />
                ))}
              </ul>
            </div>
          ) : null}

          {noLocation.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Couldn&apos;t find a place
              </h4>
              <ul className="mt-2 space-y-2">
                {noLocation.map((d) => (
                  <StrayDraftRow key={d.id} draft={d} plans={plans} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <ProUpgradeSheet
        open={showPro}
        onClose={() => setShowPro(false)}
        savesUsed={inboxSavesThisMonth}
      />
    </section>
  );
}
