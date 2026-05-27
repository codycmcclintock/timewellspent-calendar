"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ingestLink } from "@/app/actions";
import { PlanWherePicker } from "@/components/plans/PlanWherePicker";
import { ReelAutoAddToast } from "@/components/plans/ReelAutoAddToast";

export function LinkIngestBar({
  planId,
  forceInbox = false,
  placeholder = "Paste Instagram or TikTok link…",
  onLimitReached,
}: {
  planId?: string;
  /** Save to profile inbox (strays) instead of auto-routing to a trip. */
  forceInbox?: boolean;
  placeholder?: string;
  onLimitReached?: () => void;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [pickWhere, setPickWhere] = useState<{
    sourceUrl: string;
    sourceType: string;
    forceInbox: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    draftId: string;
    planSlug?: string;
  } | null>(null);

  function handleError(e: unknown) {
    if (e instanceof Error && e.message === "SAVE_LIMIT_REACHED") {
      onLimitReached?.();
      setError("You've hit your free reel saves this month. Upgrade for unlimited.");
      return;
    }
    setError(e instanceof Error ? e.message : "Could not save link");
  }

  function handleSuccess(result: Awaited<ReturnType<typeof ingestLink>>) {
    if (result.needsDestination) return;
    setUrl("");
    if (result.autoRouted && result.draft) {
      setToast({
        message: `Added ${result.draftTitle ?? "save"} to ${result.planTitle ?? "your trip"}`,
        draftId: result.draft.id,
        planSlug: result.planSlug,
      });
      router.refresh();
      return;
    }
    if (result.planSlug && !result.inbox) {
      router.push(`/plans/${result.planSlug}`);
      return;
    }
    router.refresh();
  }

  function submit() {
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await ingestLink(
          url.trim(),
          planId ? { planId } : { forceInbox },
        );
        if (result.needsDestination) {
          setPickWhere({
            sourceUrl: result.sourceUrl,
            sourceType: result.sourceType,
            forceInbox: result.forceInbox,
          });
          return;
        }
        handleSuccess(result);
      } catch (e) {
        handleError(e);
      }
    });
  }

  function saveWithDestination(destination: string, destinationKey: string) {
    if (!pickWhere) return;
    startTransition(async () => {
      try {
        const result = await ingestLink(pickWhere.sourceUrl, {
          destination,
          destinationKey,
          planId,
          forceInbox: pickWhere.forceInbox && !planId,
        });
        setPickWhere(null);
        setUrl("");
        if (result.needsDestination) return;
        handleSuccess(result);
      } catch (e) {
        handleError(e);
      }
    });
  }

  return (
    <div>
      {toast ? (
        <ReelAutoAddToast
          message={toast.message}
          draftId={toast.draftId}
          planSlug={toast.planSlug}
          onDismiss={() => setToast(null)}
        />
      ) : null}
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-card px-4 py-3 text-sm"
          placeholder={placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          type="button"
          disabled={pending || !url.trim()}
          onClick={submit}
          className="shrink-0 rounded-full bg-primary-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Save"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {pickWhere ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-4">
            <p className="font-semibold text-ink">Where is this?</p>
            <p className="mt-1 text-sm text-muted">
              We couldn&apos;t tell from the link — pick a trip destination.
            </p>
            <div className="mt-4">
              <PlanWherePicker
                onSelect={(d) => saveWithDestination(d.label, d.key)}
              />
            </div>
            <button
              type="button"
              onClick={() => setPickWhere(null)}
              className="mt-4 w-full text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
