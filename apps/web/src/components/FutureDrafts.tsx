"use client";

import Link from "next/link";
import { LinkIngestBar } from "@/components/plans/LinkIngestBar";
import { isLinkIngestEnabled } from "@/lib/feature-flags";
import type { Draft } from "@/lib/types";

export function FutureDrafts({ drafts }: { drafts: Draft[] }) {
  const unassigned = drafts.filter((d) => !d.plan_id);

  return (
    <div>
      <div className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
        <h3 className="text-center font-serif text-lg font-semibold text-ink">
          Save ideas for later
        </h3>
        <p className="mt-1 text-center text-sm leading-relaxed text-muted">
          {isLinkIngestEnabled()
            ? "Paste Instagram or TikTok — tagged by destination, ready for your next trip."
            : "Start a trip on Plans, or talk through what you're dreaming up."}
        </p>
        {isLinkIngestEnabled() ? (
          <div className="mt-4">
            <LinkIngestBar inbox />
          </div>
        ) : (
          <Link
            href="/record?mode=weekly"
            className="mt-4 flex w-full items-center justify-center rounded-full bg-primary-500 py-3 text-sm font-semibold text-white"
          >
            Talk it through
          </Link>
        )}
        <Link
          href="/plans"
          className="mt-4 block text-center text-sm font-medium text-primary-500"
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
