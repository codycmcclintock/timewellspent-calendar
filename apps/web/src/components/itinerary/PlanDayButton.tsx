"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { planThisDay, confirmPlanDaySuggestions } from "@/app/actions";
import type { PlanDaySuggestion } from "@/lib/plan-day-ai";

export function PlanDayButton({
  planId,
  planSlug,
  dayKey,
}: {
  planId: string;
  planSlug: string;
  dayKey: string;
}) {
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<PlanDaySuggestion[] | null>(
    null,
  );

  function run() {
    startTransition(async () => {
      const items = await planThisDay(planId, dayKey);
      setSuggestions(items);
    });
  }

  function confirmAll() {
    if (!suggestions?.length) return;
    startTransition(async () => {
      await confirmPlanDaySuggestions(planId, dayKey, suggestions);
      setSuggestions(null);
      window.location.reload();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <button
          type="button"
          disabled={pending}
          onClick={run}
          className="font-medium text-primary-500 disabled:opacity-50"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          {pending ? "Planning your day…" : "Plan this day from our saves"}
        </button>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <div className="mt-3 rounded-2xl bg-card p-4 ring-1 ring-primary-500/15">
          <p className="text-sm font-medium text-ink">
            {suggestions.length} suggestions
          </p>
          <ul className="mt-2 space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-muted">
                {s.title}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={pending}
            onClick={confirmAll}
            className="mt-3 w-full rounded-full bg-primary-500 py-2 text-sm font-semibold text-white"
          >
            Add all to {dayKey}
          </button>
          <button
            type="button"
            onClick={() => setSuggestions(null)}
            className="mt-2 w-full text-xs text-muted"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </>
  );
}
