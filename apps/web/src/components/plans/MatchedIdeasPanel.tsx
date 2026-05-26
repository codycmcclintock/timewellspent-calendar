import Link from "next/link";
import type { Draft } from "@/lib/types";

export function MatchedIdeasPanel({
  matches,
}: {
  matches: { draft: Draft; partnerTitle: string | null }[];
}) {
  if (matches.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-gold/30 bg-gold/5 p-4 ring-1 ring-gold/20">
      <p className="font-serif text-lg font-semibold text-ink">💫 Match</p>
      <p className="mt-1 text-sm text-muted">
        You both saved the same reel — add it to your trip in one tap.
      </p>
      <ul className="mt-3 space-y-2">
        {matches.map(({ draft, partnerTitle }) => (
          <li key={draft.id} className="rounded-xl bg-card px-3 py-2 ring-1 ring-black/5">
            <p className="text-xs font-semibold text-gold">💫 Match</p>
            <p className="font-medium text-ink">{draft.title ?? "Untitled"}</p>
            <p className="truncate text-xs text-muted">{draft.source_url}</p>
            {partnerTitle ? (
              <p className="mt-1 text-xs text-gold">Also saved by {partnerTitle}</p>
            ) : null}
            {draft.plan_id ? (
              <Link
                href="/plans"
                className="mt-1 inline-block text-xs font-medium text-primary-500"
              >
                View plan →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
