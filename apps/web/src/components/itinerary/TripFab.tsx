"use client";

import { useState } from "react";
import Link from "next/link";
import { Map, Plus, Mic, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { isLinkIngestEnabled } from "@/lib/feature-flags";

export function TripFab({ planSlug }: { planSlug: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  function showMap() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "map");
    router.replace(`/plans/${planSlug}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
        {open ? (
          <div className="mb-2 w-48 rounded-2xl bg-card py-2 shadow-lg ring-1 ring-black/10">
            <button
              type="button"
              onClick={showMap}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink"
            >
              <Map className="h-4 w-4 text-muted" />
              Map view
            </button>
            <Link
              href={`/record?mode=trip&plan=${planSlug}`}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink"
              onClick={() => setOpen(false)}
            >
              <Mic className="h-4 w-4 text-primary-500" />
              Speak
            </Link>
            {isLinkIngestEnabled() ? (
              <Link
                href={`/plans/${planSlug}`}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink"
                onClick={() => setOpen(false)}
              >
                <Sparkles className="h-4 w-4 text-muted" />
                Paste link
              </Link>
            ) : null}
            <p className="border-t border-black/5 px-4 py-2 text-xs text-muted">
              Add place — coming soon
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg"
          aria-label="Add"
        >
          <Plus className={`h-6 w-6 transition ${open ? "rotate-45" : ""}`} />
        </button>
      </div>
    </>
  );
}
