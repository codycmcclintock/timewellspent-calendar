"use client";

import { X } from "lucide-react";
import {
  FREE_INBOX_REEL_SAVES_PER_MONTH,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
} from "@/lib/pricing";

export function ProUpgradeSheet({
  open,
  onClose,
  savesUsed,
}: {
  open: boolean;
  onClose: () => void;
  savesUsed?: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <p className="text-center text-3xl" aria-hidden>
          💫
        </p>
        <h3 className="mt-2 text-center font-serif text-xl font-semibold text-ink">
          Unlimited saves
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted">
          {savesUsed != null
            ? `You've used ${savesUsed} of ${FREE_INBOX_REEL_SAVES_PER_MONTH} free reel saves this month.`
            : `Free includes ${FREE_INBOX_REEL_SAVES_PER_MONTH} reel saves per month to your inbox.`}
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          Trips, voice planning, AI days, and matches stay free.
        </p>
        <div className="mt-5 rounded-2xl bg-primary-50 p-4 text-center ring-1 ring-primary-500/20">
          <p className="font-serif text-2xl font-semibold text-ink">
            ${PRO_PRICE_YEARLY}
            <span className="text-sm font-normal text-muted">/year</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            or ${PRO_PRICE_MONTHLY}/month · less than half Wanderlog
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full bg-primary-500 py-3 text-sm font-semibold text-white"
        >
          Got it — checkout coming soon
        </button>
      </div>
    </div>
  );
}
