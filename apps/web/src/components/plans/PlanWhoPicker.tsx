"use client";

import { useState } from "react";
import { PartnerInviteBanner } from "@/components/PartnerInviteBannerClient";

export function PlanWhoPicker({
  inviteUrl,
  hasPartner,
  partnerName,
  onJustMe,
  onContinue,
}: {
  inviteUrl: string | null;
  hasPartner: boolean;
  partnerName: string | null;
  onJustMe: () => void;
  onContinue: () => void;
}) {
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-4">
      <p className="font-serif text-xl font-semibold text-ink">Who&apos;s coming?</p>
      <p className="text-sm text-muted">We&apos;ll keep them in the loop.</p>

      {hasPartner && partnerName ? (
        <div className="rounded-2xl bg-primary-50 px-4 py-3 ring-1 ring-primary-500/15">
          <p className="font-medium text-ink">{partnerName}</p>
          <p className="text-sm text-muted">Already on this trip with you.</p>
        </div>
      ) : inviteUrl ? (
        <PartnerInviteBanner inviteUrl={inviteUrl} variant="card" />
      ) : null}

      {!hasPartner ? (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
          <p className="text-sm font-medium text-ink">Invite someone new</p>
          <input
            type="email"
            placeholder="Email (coming soon)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            disabled
          />
          <p className="mt-2 text-xs text-muted">
            Share your invite link above for now — they&apos;ll join your couple.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 pt-4">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-primary-500 py-3.5 text-sm font-semibold text-white"
        >
          {hasPartner ? "Create trip" : "Create trip"}
        </button>
        <button
          type="button"
          onClick={onJustMe}
          className="w-full py-2 text-sm font-medium text-muted"
        >
          Just me
        </button>
      </div>
    </div>
  );
}
