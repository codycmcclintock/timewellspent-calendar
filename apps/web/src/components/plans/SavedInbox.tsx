"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import { ProUpgradeSheet } from "@/components/plans/ProUpgradeSheet";
import { FREE_INBOX_REEL_SAVES_PER_MONTH } from "@/lib/pricing";
import type { Draft } from "@/lib/types";

export function SavedInbox({
  drafts,
  inboxSavesThisMonth,
  isPro,
}: {
  drafts: Draft[];
  inboxSavesThisMonth: number;
  isPro: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showPro, setShowPro] = useState(false);

  const inbox = drafts.filter((d) => !d.plan_id && d.source_url);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">Saved reels</h3>
        <p className="text-sm text-muted">
          Paste Instagram or TikTok — we tag the destination. Assign to a trip
          when you&apos;re ready.
        </p>
        {!isPro ? (
          <p className="mt-1 text-xs text-primary-600">
            {inboxSavesThisMonth}/{FREE_INBOX_REEL_SAVES_PER_MONTH} inbox saves
            this month
          </p>
        ) : null}
      </div>

      <LinkIngestBar
        inbox
        onLimitReached={() => setShowPro(true)}
      />

      {inbox.length === 0 ? (
        <p className="rounded-xl bg-planner/80 px-4 py-6 text-center text-sm text-muted">
          Nothing saved yet. Share a reel here first.
        </p>
      ) : (
        <ul className="space-y-2">
          {inbox.map((d) => {
            const dest =
              (d.raw_metadata as { destination?: string })?.destination ??
              d.place_name ??
              "Trip ideas";
            return (
              <li
                key={d.id}
                className="rounded-xl bg-card px-4 py-3 ring-1 ring-black/5"
              >
                <p className="text-xs font-medium text-primary-500">{dest}</p>
                <p className="font-medium text-ink">{d.title ?? "Untitled"}</p>
                <p className="mt-1 truncate text-xs text-muted">{d.source_url}</p>
              </li>
            );
          })}
        </ul>
      )}

      <ProUpgradeSheet
        open={showPro}
        onClose={() => setShowPro(false)}
        savesUsed={inboxSavesThisMonth}
      />
    </section>
  );
}
