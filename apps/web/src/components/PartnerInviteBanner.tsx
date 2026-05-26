"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, X } from "lucide-react";
import {
  INVITE_BANNER_BODY,
  INVITE_BANNER_SLIM,
  INVITE_BANNER_TITLE,
  INVITE_SHARE_TEXT,
  INVITE_SHARE_TITLE,
} from "@/lib/partner-copy";

const DISMISS_KEY = "ruffles-invite-dismissed";

export function PartnerInviteBanner({
  inviteUrl,
  variant = "card",
}: {
  inviteUrl: string;
  variant?: "card" | "slim";
}) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  if (dismissed) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function shareLink() {
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

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (variant === "slim") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-coral/25 bg-coral/5 px-4 py-3">
        <p className="text-sm text-ink">
          <span className="font-medium">{INVITE_BANNER_SLIM}</span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="relative rounded-2xl border border-coral/30 bg-gradient-to-br from-coral/5 to-planner p-4 ring-1 ring-coral/10">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-muted hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 font-semibold text-ink">{INVITE_BANNER_TITLE}</p>
      <p className="mt-1 text-sm leading-snug text-muted">{INVITE_BANNER_BODY}</p>
      <p className="mt-3 break-all rounded-xl bg-card/80 px-3 py-2 font-mono text-[11px] text-muted ring-1 ring-black/5">
        {inviteUrl}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-coral py-2.5 text-sm font-semibold text-white"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={shareLink}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-coral/40 bg-card py-2.5 text-sm font-semibold text-coral"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </section>
  );
}
