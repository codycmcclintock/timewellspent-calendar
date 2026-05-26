"use client";

import { PartnerInviteBanner } from "@/components/PartnerInviteBannerClient";

export function PlanWhoPicker({
  inviteUrl,
  hasPartner,
  partnerName,
  onJustMe,
  onContinue,
  embedded = false,
}: {
  inviteUrl: string | null;
  hasPartner: boolean;
  partnerName: string | null;
  onJustMe: () => void;
  onContinue: () => void;
  /** When true, parent (NewPlanWizard) already shows the step title. */
  embedded?: boolean;
}) {
  return (
    <div className="space-y-4">
      {!embedded ? (
        <>
          <p className="font-serif text-xl font-semibold text-ink">
            Who&apos;s coming?
          </p>
          <p className="text-sm text-muted">We&apos;ll keep them in the loop.</p>
        </>
      ) : null}

      {hasPartner && partnerName ? (
        <div className="rounded-2xl bg-primary-50 px-4 py-3 ring-1 ring-primary-500/15">
          <p className="font-medium text-ink">{partnerName}</p>
          <p className="text-sm text-muted">Already on this trip with you.</p>
        </div>
      ) : inviteUrl ? (
        <PartnerInviteBanner inviteUrl={inviteUrl} variant="card" />
      ) : (
        <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted ring-1 ring-black/5">
          Invite link unavailable — try again from Profile.
        </p>
      )}

      {!hasPartner && inviteUrl ? (
        <p className="text-center text-xs text-muted">
          Copy the link above and send it to your partner. You can create the trip
          now — they&apos;ll join the same calendar when they sign up.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-primary-500 py-3.5 text-sm font-semibold text-white"
        >
          Create trip
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
