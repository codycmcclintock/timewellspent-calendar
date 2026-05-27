import Link from "next/link";
import type { Draft } from "@/lib/types";

export function MatchedIdeasPanel({
  matches,
}: {
  matches: { draft: Draft; partnerTitle: string | null }[];
}) {
  if (matches.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border-2 border-gold/40 bg-gold/10 p-4 shadow-[0_0_0_4px_rgba(255,184,0,0.08)] ring-1 ring-gold/25">
      <p className="font-serif text-xl font-semibold text-ink">It&apos;s a match!</p>
      <p className="mt-1 text-sm text-muted">
        You and your partner saved the same spot — the dopamine hit.
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
