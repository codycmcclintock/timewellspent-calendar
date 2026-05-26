"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MapPin, Calendar, Users } from "lucide-react";
import { PlanWherePicker } from "@/components/plans/PlanWherePicker";
import {
  PlanWhenPicker,
  type WhenSelection,
} from "@/components/plans/PlanWhenPicker";
import { PlanWhoPicker } from "@/components/plans/PlanWhoPicker";
import { createPlan } from "@/app/actions";

type Step = "where" | "when" | "who";

export function NewPlanWizard({
  inviteUrl,
  hasPartner,
  partnerName,
}: {
  inviteUrl: string | null;
  hasPartner: boolean;
  partnerName: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("where");
  const [where, setWhere] = useState<{ label: string; key: string } | null>(
    null,
  );
  const [when, setWhen] = useState<WhenSelection>({
    dateMode: "flexible_month",
    flexibleMonth: undefined,
    tripLengthDays: 3,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!where) return;
    startTransition(async () => {
      try {
        const plan = await createPlan({
          destination: where.label,
          destinationKey: where.key,
          dateMode: when.dateMode,
          flexibleMonth: when.flexibleMonth,
          startsOn: when.startsOn,
          endsOn: when.endsOn,
          tripLengthDays: when.tripLengthDays,
        });
        router.push(`/plans/${plan.slug}?tab=itinerary`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create plan");
      }
    });
  }

  return (
    <div className="-mx-4 min-h-[70vh] bg-shell px-4 pb-8">
      <div className="flex items-center justify-between py-2">
        <Link href="/plans" className="text-sm text-muted">
          Cancel
        </Link>
        <h1 className="font-serif text-lg font-semibold">New trip</h1>
        <span className="w-12" />
      </div>

      <p className="mt-2 text-center font-serif text-2xl font-semibold text-ink">
        {step === "where"
          ? "Where are we going?"
          : step === "when"
            ? "When?"
            : "Who's coming?"}
      </p>
      <p className="text-center text-sm text-muted">
        {step === "where"
          ? "We'll handle the rest"
          : step === "when"
            ? "Flexible? Skip to invite."
            : "We'll keep them in the loop"}
      </p>

      <div className="mt-4 space-y-1 rounded-2xl bg-card ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => setStep("where")}
          className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-4 text-left"
        >
          <MapPin className="h-5 w-5 text-primary-500" />
          <div className="flex-1">
            <p className="font-semibold text-ink">Where</p>
            <p className="text-sm text-muted">
              {where ? where.label : "Select destination"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>
        <button
          type="button"
          onClick={() => where && setStep("when")}
          disabled={!where}
          className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-4 text-left disabled:opacity-40"
        >
          <Calendar className="h-5 w-5 text-primary-500" />
          <div className="flex-1">
            <p className="font-semibold text-ink">When</p>
            <p className="text-sm text-muted">
              {when.dateMode === "exact" && when.startsOn
                ? `${when.startsOn}${when.endsOn ? ` – ${when.endsOn}` : ""}`
                : when.flexibleMonth
                  ? `${when.flexibleMonth} · ${when.tripLengthDays} days`
                  : "Flexible"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>
        <button
          type="button"
          onClick={() => where && setStep("who")}
          disabled={!where}
          className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
        >
          <Users className="h-5 w-5 text-primary-500" />
          <div className="flex-1">
            <p className="font-semibold text-ink">Who</p>
            <p className="text-sm text-muted">
              {hasPartner ? partnerName : "Invite partner"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>
      </div>

      {step === "where" ? (
        <div className="mt-6">
          <PlanWherePicker
            onSelect={(d) => {
              setWhere(d);
              setStep("when");
            }}
          />
        </div>
      ) : step === "when" ? (
        <div className="mt-6">
          <PlanWhenPicker value={when} onChange={setWhen} />
          <button
            type="button"
            onClick={() => setStep("who")}
            className="mt-4 w-full text-sm text-muted"
          >
            Skip — I&apos;m flexible
          </button>
          <button
            type="button"
            disabled={!where}
            onClick={() => setStep("who")}
            className="mt-2 w-full rounded-full bg-primary-500 py-3.5 text-sm font-semibold text-white"
          >
            Next
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <PlanWhoPicker
            inviteUrl={inviteUrl}
            hasPartner={hasPartner}
            partnerName={partnerName}
            onJustMe={save}
            onContinue={save}
          />
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {pending ? (
        <p className="mt-4 text-center text-sm text-muted">Creating trip…</p>
      ) : null}
    </div>
  );
}
