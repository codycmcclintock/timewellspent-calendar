"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAllTripsForCouple } from "@/app/actions";
import { formatActionError } from "@/lib/format-action-error";

const STORAGE_PREFIX = "ruffles-";

export function SettingsDevPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clearLocalData() {
    if (
      !window.confirm(
        "Clear all Ruffles local data (dismissed banners, teaching sheet, etc.)?",
      )
    ) {
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem("ruffles-sync-delight");
    setMessage(`Cleared ${keys.length} local storage keys.`);
    setError(null);
    router.refresh();
  }

  function removeAllTrips() {
    if (
      !window.confirm(
        "Delete all your trips? Joshua Tree demo trip will be kept. This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAllTripsForCouple({ keepJoshuaTree: true });
        setMessage(`Removed ${result.deleted} trip(s).`);
        router.refresh();
      } catch (e) {
        setError(formatActionError(e));
      }
    });
  }

  return (
    <section className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        Developer tools
      </p>
      <p className="mt-1 text-sm text-muted">
        Only visible in development or when NEXT_PUBLIC_DEV_LOGIN is set.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={removeAllTrips}
          className="rounded-full border border-red-500/30 bg-white py-2.5 text-sm font-medium text-red-700"
        >
          {pending ? "Removing…" : "Remove all trips (keep Joshua Tree)"}
        </button>
        <button
          type="button"
          onClick={clearLocalData}
          className="rounded-full border border-black/10 bg-white py-2.5 text-sm font-medium text-ink"
        >
          Clear local app data
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-sage">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
