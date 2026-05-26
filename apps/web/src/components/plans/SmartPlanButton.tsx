"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { smartPlan } from "@/app/actions";

export function SmartPlanButton({
  planId,
  disabled,
}: {
  planId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        await smartPlan(planId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Smart plan failed");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={run}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-500/30 bg-primary-500/5 py-3.5 text-sm font-semibold text-ink disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4 text-primary-500" />
        {pending ? "Planning…" : "Plan this day from our saves"}
      </button>
      {error ? <p className="mt-2 text-center text-sm text-red-600">{error}</p> : null}
    </>
  );
}
