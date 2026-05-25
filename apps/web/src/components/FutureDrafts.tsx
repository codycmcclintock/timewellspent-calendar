"use client";

import Link from "next/link";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import type { Draft } from "@/lib/types";

export function FutureDrafts({ drafts }: { drafts: Draft[] }) {
  const unassigned = drafts.filter((d) => !d.plan_id);

  return (
    <div>
      <div className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
        <h3 className="text-center font-semibold text-ink">Save reels to a trip</h3>
        <p className="mt-1 text-center text-sm text-muted">
          Paste Instagram or TikTok — we&apos;ll open the right city plan and add it to your
          unsorted list.
        </p>
        <div className="mt-4">
          <LinkIngestBar />
        </div>
        <Link
          href="/plans"
          className="mt-4 block text-center text-sm font-medium text-coral"
        >
          View all plans →
        </Link>
      </div>

      {unassigned.length > 0 ? (
        <ul className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Not on a plan yet
          </p>
          {unassigned.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl bg-card p-4 ring-1 ring-black/5"
            >
              <p className="font-medium text-ink">{d.title ?? "Untitled"}</p>
              <p className="mt-1 truncate text-xs text-muted">{d.source_url}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
