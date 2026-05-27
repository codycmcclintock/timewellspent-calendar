"use client";

import { useState } from "react";
import { X, Copy, Share2, Check } from "lucide-react";
import {
  INVITE_BANNER_BODY,
  INVITE_BANNER_TITLE,
  INVITE_SHARE_TEXT,
  INVITE_SHARE_TITLE,
} from "@/lib/partner-copy";

export function InvitePartnerSheet({
  open,
  onClose,
  inviteUrl,
}: {
  open: boolean;
  onClose: () => void;
  inviteUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function shareLink() {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: INVITE_SHARE_TITLE,
          text: INVITE_SHARE_TEXT,
          url: inviteUrl,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="w-full max-w-lg rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-labelledby="invite-partner-title"
      >
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <h2
          id="invite-partner-title"
          className="font-serif text-xl font-semibold text-ink"
        >
          {INVITE_BANNER_TITLE}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {INVITE_BANNER_BODY}
        </p>
        {inviteUrl ? (
          <>
            <p className="mt-4 break-all rounded-xl bg-shell px-3 py-2 font-mono text-[11px] text-muted ring-1 ring-black/5">
              {inviteUrl}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-500 py-3 text-sm font-semibold text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={shareLink}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary-500/40 py-3 text-sm font-semibold text-primary-500"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Invite link is loading. Try again from Profile in a moment.
          </p>
        )}
      </div>
    </div>
  );
}
