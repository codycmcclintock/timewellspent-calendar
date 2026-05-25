"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MapPin, Calendar } from "lucide-react";
import { PlanWherePicker } from "@/components/plans/PlanWherePicker";
import {
  PlanWhenPicker,
  type WhenSelection,
} from "@/components/plans/PlanWhenPicker";
import { createPlan } from "@/app/actions";

export default function NewPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState<"where" | "when">("where");
  const [where, setWhere] = useState<{ label: string; key: string } | null>(null);
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
        router.push(`/plans/${plan.slug}`);
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
        <h1 className="font-serif text-lg font-semibold">Create plan</h1>
        <span className="w-12" />
      </div>

      <div className="mt-4 space-y-1 rounded-2xl bg-card ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => setStep("where")}
          className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-4 text-left"
        >
          <MapPin className="h-5 w-5 text-coral" />
          <div className="flex-1">
            <p className="font-semibold text-ink">Where?</p>
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
          className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:opacity-40"
        >
          <Calendar className="h-5 w-5 text-coral" />
          <div className="flex-1">
            <p className="font-semibold text-ink">When?</p>
            <p className="text-sm text-muted">
              {when.dateMode === "exact" && when.startsOn
                ? `${when.startsOn}${when.endsOn ? ` – ${when.endsOn}` : ""}`
                : when.flexibleMonth
                  ? `${when.flexibleMonth} · ${when.tripLengthDays} days`
                  : "Select dates"}
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
      ) : (
        <div className="mt-6">
          <PlanWhenPicker value={when} onChange={setWhen} />
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={pending || !where}
            onClick={save}
            className="mt-6 w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Creating…" : "Save plan"}
          </button>
        </div>
      )}
    </div>
  );
}
