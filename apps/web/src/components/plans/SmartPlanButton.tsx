"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { smartPlan } from "@/app/actions";

export function SmartPlanButton({
  planId,
  isPro,
  disabled,
}: {
  planId: string;
  isPro: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [showUpsell, setShowUpsell] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!isPro) {
      setShowUpsell(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await smartPlan(planId);
        router.refresh();
      } catch (e) {
        if (e instanceof Error && e.message === "PRO_REQUIRED") {
          setShowUpsell(true);
        } else {
          setError(e instanceof Error ? e.message : "Smart Plan failed");
        }
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={run}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-coral bg-coral/5 py-3.5 text-sm font-semibold text-coral disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" />
        {pending ? "Planning…" : "Smart Plan (pro)"}
      </button>
      {error ? <p className="mt-2 text-center text-sm text-red-600">{error}</p> : null}

      {showUpsell ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowUpsell(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            <Sparkles className="mx-auto h-10 w-10 text-coral" />
            <h3 className="mt-3 text-center font-serif text-xl font-semibold">
              Smart Plan (pro)
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>Reorder stops into the best day-by-day flow</li>
              <li>Map times so you&apos;re not crisscrossing the city</li>
              <li>Fill empty gaps with ideas that actually fit</li>
            </ul>
            <p className="mt-4 text-center text-xs text-muted">
              Pro checkout coming soon. For now, build your unsorted list for free.
            </p>
            <button
              type="button"
              onClick={() => setShowUpsell(false)}
              className="mt-4 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
