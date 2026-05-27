"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { addMonths, format } from "date-fns";
import { createPlan } from "@/app/actions";
import { formatActionError } from "@/lib/format-action-error";
import {
  whenCanContinue,
  whenCtaLabel,
} from "@/lib/create-trip-dates";
import { confettiBurst } from "@/lib/confetti-burst";
import type { WhenSelection } from "@/components/plans/PlanWhenPicker";
import { CreateTripProgress } from "@/components/plans/create-trip/CreateTripProgress";
import { CreateTripStepWhere } from "@/components/plans/create-trip/CreateTripStepWhere";
import { CreateTripStepWhen } from "@/components/plans/create-trip/CreateTripStepWhen";
import { CreateTripStepInvite } from "@/components/plans/create-trip/CreateTripStepInvite";
import {
  defaultWhenSelection,
  type WhereSelection,
} from "@/components/plans/create-trip/types";

type Step = 1 | 2 | 3;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function CreateTripFlow({
  inviteUrl,
  inviteToken,
}: {
  inviteUrl: string | null;
  inviteToken: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [where, setWhere] = useState<WhereSelection | null>(null);
  const [when, setWhen] = useState<WhenSelection>(defaultWhenSelection);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reducedMotion = useReducedMotion();

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function createTrip() {
    if (!where) return;
    const flexibleMonth =
      when.flexibleMonth ??
      (when.dateMode === "flexible_month"
        ? format(addMonths(new Date(), 1), "yyyy-MM")
        : undefined);

    startTransition(async () => {
      try {
        const plan = await createPlan({
          destination: where.label,
          destinationKey: where.key,
          dateMode: when.dateMode,
          flexibleMonth,
          startsOn: when.startsOn,
          endsOn: when.endsOn,
          tripLengthDays: when.tripLengthDays,
        });
        confettiBurst();
        router.push(`/plans/${plan.slug}?created=1`);
      } catch (e) {
        setError(formatActionError(e));
      }
    });
  }

  const whereReady = !!where;
  const whenReady = whenCanContinue(when);
  const ctaWhen = whenCtaLabel(when);

  let ctaLabel = "Continue →";
  let ctaEnabled = false;
  let ctaAction: () => void = () => {};

  if (step === 1) {
    ctaLabel = "Continue →";
    ctaEnabled = whereReady;
    ctaAction = () => whereReady && goTo(2);
  } else if (step === 2) {
    ctaLabel = ctaWhen;
    ctaEnabled = whenReady;
    ctaAction = () => whenReady && goTo(3);
  } else {
    ctaLabel = pending ? "Creating trip…" : "Create trip";
    ctaEnabled = !pending;
    ctaAction = createTrip;
  }

  return (
    <div className="-mx-4 flex min-h-screen flex-col bg-shell">
      <header className="shrink-0 px-4 pt-2">
        <div className="flex items-center justify-between">
          {step === 1 ? (
            <Link href="/plans" className="text-sm font-medium text-muted">
              Cancel
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => goTo((step - 1) as Step)}
              className="text-sm font-medium text-muted"
            >
              Back
            </button>
          )}
          <p className="text-sm font-medium text-ink">
            {step === 1 ? "Where" : step === 2 ? "When" : "Invite"}
          </p>
          <span className="w-14" />
        </div>
        <CreateTripProgress step={step} />
      </header>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={reducedMotion ? undefined : slideVariants}
            initial={reducedMotion ? false : "enter"}
            animate="center"
            exit={reducedMotion ? undefined : "exit"}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col overflow-y-auto"
          >
            {step === 1 ? (
              <CreateTripStepWhere value={where} onChange={setWhere} />
            ) : step === 2 ? (
              <CreateTripStepWhen
                destinationLabel={where?.label ?? ""}
                value={when}
                onChange={setWhen}
              />
            ) : (
              <CreateTripStepInvite
                destinationLabel={where?.label ?? ""}
                when={when}
                inviteUrl={inviteUrl}
                inviteToken={inviteToken}
                onSolo={createTrip}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-black/5 bg-shell px-4 pb-8 pt-3">
        {error ? (
          <p className="mb-2 text-center text-sm text-red-600">{error}</p>
        ) : null}
        <button
          type="button"
          disabled={!ctaEnabled}
          onClick={ctaAction}
          className={`w-full rounded-full py-3.5 text-sm font-semibold transition-colors duration-200 ${
            ctaEnabled
              ? "bg-primary-500 text-white"
              : "bg-black/10 text-muted"
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
