"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moveDraftToInbox } from "@/app/actions";

export function ReelAutoAddToast({
  message,
  draftId,
  planSlug,
  onDismiss,
}: {
  message: string;
  draftId: string;
  planSlug?: string;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function undo() {
    startTransition(async () => {
      await moveDraftToInbox(draftId);
      onDismiss();
      router.refresh();
    });
  }

  return (
    <div
      role="status"
      className="fixed left-4 right-4 top-4 z-[100] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl bg-primary-500 px-4 py-3 text-sm text-white shadow-lg"
    >
      <p className="min-w-0 flex-1 font-medium">
        {message}
        {planSlug ? (
          <>
            {" "}
            <Link href={`/plans/${planSlug}`} className="underline">
              View
            </Link>
          </>
        ) : null}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={undo}
        className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
      >
        Undo
      </button>
    </div>
  );
}
