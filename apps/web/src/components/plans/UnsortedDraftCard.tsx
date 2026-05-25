import { ExternalLink } from "lucide-react";
import type { Draft } from "@/lib/types";

function sourceBadge(type: string | null) {
  if (type === "instagram") return "Instagram";
  if (type === "tiktok") return "TikTok";
  return "Link";
}

export function UnsortedDraftCard({ draft }: { draft: Draft }) {
  const meta = draft.raw_metadata ?? {};
  const thumb =
    typeof meta.thumbnail === "string" ? meta.thumbnail : null;

  return (
    <article className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-black/5">
      {thumb ? (
        <img src={thumb} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coral/20 to-planner text-lg">
          {draft.source_type === "tiktok" ? "♪" : draft.source_type === "instagram" ? "◎" : "↗"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-ink line-clamp-2">
            {draft.title ?? "Saved idea"}
          </p>
          <span className="shrink-0 rounded-full bg-shell px-2 py-0.5 text-[10px] font-medium text-muted">
            {sourceBadge(draft.source_type)}
          </span>
        </div>
        {draft.place_name ? (
          <p className="mt-0.5 text-xs text-muted">{draft.place_name}</p>
        ) : null}
        {draft.source_url ? (
          <a
            href={draft.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-coral"
          >
            Open link
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
