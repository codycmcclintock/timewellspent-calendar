"use client";

import { useState, useTransition } from "react";
import { X, Settings2 } from "lucide-react";
import {
  PlanWhenPicker,
  type WhenSelection,
} from "@/components/plans/PlanWhenPicker";
import { PartnerInviteBanner } from "@/components/PartnerInviteBanner";
import { updatePlanSettings } from "@/app/actions";
import type { Plan } from "@/lib/types";

export function PlanSettingsSheet({
  plan,
  inviteUrl,
  showPartnerInvite,
}: {
  plan: Plan;
  inviteUrl?: string;
  showPartnerInvite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [when, setWhen] = useState<WhenSelection>({
    dateMode: plan.date_mode ?? "flexible_month",
    flexibleMonth: plan.flexible_month ?? undefined,
    startsOn: plan.starts_on ?? undefined,
    endsOn: plan.ends_on ?? undefined,
    tripLengthDays: plan.trip_length_days ?? 3,
  });
  const [days, setDays] = useState(plan.trip_length_days ?? 3);

  function save() {
    startTransition(async () => {
      await updatePlanSettings({
        planId: plan.id,
        tripLengthDays: days,
        dateMode: when.dateMode,
        flexibleMonth: when.flexibleMonth,
        startsOn: when.startsOn,
        endsOn: when.endsOn,
      });
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-card px-4 py-2 text-sm font-medium text-ink"
      >
        <Settings2 className="h-4 w-4 text-coral" />
        Trip settings
      </button>
      {open ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Trip settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-shell"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">{plan.destination ?? plan.title}</p>

            <div className="mt-4">
              <p className="text-sm font-semibold">How many days?</p>
              <input
                type="range"
                min={1}
                max={21}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-2 w-full accent-coral"
              />
              <p className="text-center text-sm text-muted">{days} days</p>
            </div>

            <div className="mt-6">
              <PlanWhenPicker value={{ ...when, tripLengthDays: days }} onChange={setWhen} />
            </div>

            {showPartnerInvite && inviteUrl ? (
              <div className="mt-6">
                <PartnerInviteBanner inviteUrl={inviteUrl} variant="slim" />
              </div>
            ) : null}

            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="mt-6 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
