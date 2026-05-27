"use client";

import { useState } from "react";
import { Copy, Share2, Check, MessageCircle } from "lucide-react";
import { InvitePartnerSheet } from "@/components/InvitePartnerSheet";
import { joinInviteUrl } from "@/lib/app-url";
import { formatWhenSummary } from "@/lib/create-trip-dates";
import type { WhenSelection } from "@/components/plans/PlanWhenPicker";
import {
  INVITE_SHARE_TEXT,
  INVITE_SHARE_TITLE,
} from "@/lib/partner-copy";

export function CreateTripStepInvite({
  destinationLabel,
  when,
  inviteUrl,
  inviteToken,
  onSolo,
}: {
  destinationLabel: string;
  when: WhenSelection;
  inviteUrl: string | null;
  inviteToken: string | null;
  onSolo: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const whenSummary = formatWhenSummary({
    dateMode: when.dateMode,
    startsOn: when.startsOn,
    endsOn: when.endsOn,
    flexibleMonth: when.flexibleMonth,
    tripLengthDays: when.tripLengthDays,
  });

  const link = inviteUrl ?? (inviteToken ? joinInviteUrl(inviteToken) : null);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function shareNative() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: INVITE_SHARE_TITLE,
          text: INVITE_SHARE_TEXT,
          url: link,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <p className="text-center text-xs font-medium text-muted">
        {destinationLabel} · {whenSummary}
      </p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Step 3 of 3
      </p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
        Bring people in?
      </h2>
      <p className="mt-1 text-sm text-muted">
        Invite anyone — when you both save the same place, it&apos;ll match.
      </p>

      {link ? (
        <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-black/5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Trip link
          </p>
          <p className="mt-2 break-all rounded-xl bg-shell px-3 py-2 font-mono text-[11px] text-muted">
            {link}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-sm font-semibold text-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={shareNative}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/10 py-2.5 text-sm font-semibold text-ink"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-primary-500"
          >
            <MessageCircle className="h-4 w-4" />
            More invite options
          </button>
        </div>
      ) : (
        <p className="mt-6 rounded-xl bg-card px-4 py-3 text-sm text-muted ring-1 ring-black/5">
          Invite link loading… you can still create the trip and invite from Profile.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">The magic:</span> when two of you save the
        same spot, it shows up as a match — like Tinder, but for places.
      </div>

      <button
        type="button"
        onClick={onSolo}
        className="mt-6 w-full py-2 text-center text-sm text-muted underline-offset-2 hover:underline"
      >
        Just me for now
      </button>

      <InvitePartnerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        inviteUrl={inviteUrl}
      />
    </div>
  );
}
