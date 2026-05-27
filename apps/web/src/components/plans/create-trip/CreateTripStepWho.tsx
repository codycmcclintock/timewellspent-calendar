"use client";

import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { InvitePartnerSheet } from "@/components/InvitePartnerSheet";
import { formatWhenSummary } from "@/lib/create-trip-dates";
import type { WhenSelection } from "@/components/plans/PlanWhenPicker";

export function CreateTripStepWho({
  destinationLabel,
  when,
  inviteUrl,
  partnerName,
  hasPartner,
  partnerSelected,
  onPartnerSelectedChange,
  onSolo,
}: {
  destinationLabel: string;
  when: WhenSelection;
  inviteUrl: string | null;
  partnerName: string | null;
  hasPartner: boolean;
  partnerSelected: boolean;
  onPartnerSelectedChange: (v: boolean) => void;
  onSolo: () => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const whenSummary = formatWhenSummary({
    dateMode: when.dateMode,
    startsOn: when.startsOn,
    endsOn: when.endsOn,
    flexibleMonth: when.flexibleMonth,
    tripLengthDays: when.tripLengthDays,
  });

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <p className="text-center text-xs font-medium text-muted">
        {destinationLabel} · {whenSummary}
      </p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Step 3 of 3
      </p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
        Who&apos;s coming?
      </h2>
      <p className="mt-1 text-sm text-muted">
        Add your people — or start solo and invite later.
      </p>

      <p className="mt-6 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Your people on Ruffles
      </p>

      {hasPartner && partnerName ? (
        <button
          type="button"
          onClick={() => onPartnerSelectedChange(!partnerSelected)}
          className={`mt-2 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
            partnerSelected
              ? "border-primary-500 bg-primary-50"
              : "border-black/10 bg-card"
          }`}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              partnerSelected
                ? "bg-primary-500 text-white"
                : "bg-shell text-ink"
            }`}
          >
            {partnerName.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink">{partnerName}</p>
            <p className="text-xs text-muted">Partner</p>
          </div>
          {partnerSelected ? (
            <Check className="h-5 w-5 text-primary-500" />
          ) : null}
        </button>
      ) : (
        <p className="mt-2 rounded-xl bg-card px-4 py-3 text-sm text-muted ring-1 ring-black/5">
          No partner on Ruffles yet — invite them below.
        </p>
      )}

      <button
        type="button"
        onClick={() => setInviteOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-primary-500/40 py-3 text-sm font-semibold text-primary-500"
      >
        <UserPlus className="h-4 w-4" />
        Invite by phone or email
      </button>

      <button
        type="button"
        onClick={onSolo}
        className="mt-6 w-full py-2 text-center text-sm text-muted underline-offset-2 hover:underline"
      >
        Or continue solo — you can invite later
      </button>

      <InvitePartnerSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteUrl={inviteUrl}
      />
    </div>
  );
}
