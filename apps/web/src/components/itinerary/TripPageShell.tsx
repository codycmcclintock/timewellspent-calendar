"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import type { Plan } from "@/lib/types";

const TABS = ["overview", "itinerary", "map", "notes"] as const;

export function TripPageShell({
  plan,
  children,
}: {
  plan: Plan;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as (typeof TABS)[number]) || "itinerary";

  function setTab(t: (typeof TABS)[number]) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`/plans/${plan.slug}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="-mx-4">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-shell/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/plans"
            className="flex items-center gap-1 text-sm text-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="truncate font-serif text-lg font-semibold text-ink">
            {plan.title}
          </h1>
          <button
            type="button"
            className="rounded-full p-2 text-muted"
            aria-label="Share"
            onClick={() => {
              if (navigator.share) {
                void navigator.share({
                  title: plan.title,
                  url: window.location.href,
                });
              }
            }}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                tab === t
                  ? "bg-primary-500 text-white"
                  : "bg-card text-muted ring-1 ring-black/5"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {tab === "itinerary" ? (
        children
      ) : tab === "map" ? (
        <div className="px-4 py-12 text-center">
          <p className="font-serif text-lg text-ink">Map view</p>
          <p className="mt-2 text-sm text-muted">
            Pins and route export coming soon. Set{" "}
            <code className="text-xs">NEXT_PUBLIC_MAPS_KEY</code> to enable.
          </p>
        </div>
      ) : tab === "notes" ? (
        <div className="px-4 py-12 text-center text-sm text-muted">
          Trip notes — add from the + menu on itinerary.
        </div>
      ) : (
        <div className="px-4 py-8 text-sm text-muted">
          {plan.description ?? "Trip overview"}
        </div>
      )}
    </div>
  );
}
