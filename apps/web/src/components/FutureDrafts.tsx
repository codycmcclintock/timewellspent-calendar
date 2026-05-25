"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { createDraft } from "@/app/actions";
import type { Draft } from "@/lib/types";

export function FutureDrafts({ drafts }: { drafts: Draft[] }) {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!url.trim()) return;
    startTransition(async () => {
      await createDraft(url.trim());
      setUrl("");
    });
  }

  return (
    <div>
      <div className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-shell">
          <Link2 className="h-6 w-6 text-muted" />
        </div>
        <h3 className="text-center font-semibold text-ink">Save ideas for later</h3>
        <p className="mt-1 text-center text-sm text-muted">
          Paste a link or share from Instagram / TikTok — we&apos;ll help you plan it soon.
        </p>
        <input
          className="mt-4 w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          disabled={pending || !url.trim()}
          onClick={save}
          className="mt-3 w-full rounded-full bg-blue py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save to drafts"}
        </button>
      </div>

      {drafts.length > 0 && (
        <ul className="mt-6 space-y-3">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl bg-card p-4 ring-1 ring-black/5"
            >
              <p className="font-medium text-ink">{d.title ?? "Untitled"}</p>
              <p className="mt-1 truncate text-xs text-muted">{d.source_url}</p>
              <span className="mt-2 inline-block rounded-full bg-shell px-2 py-0.5 text-xs text-muted">
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
