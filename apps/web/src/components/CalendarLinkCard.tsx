"use client";

import { useState } from "react";
import { Calendar, Copy, Share2, Check } from "lucide-react";
import { rotateIcsToken } from "@/app/actions";

export function CalendarLinkCard({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: "Subscribe to my Ruffles calendar",
        text: "Add this to Apple Calendar — no app needed.",
        url: feedUrl,
      });
    } else {
      copy();
    }
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10">
          <Calendar className="h-6 w-6 text-coral" />
        </div>
        <div>
          <h3 className="font-semibold text-ink">Your calendar link</h3>
          <p className="text-xs text-muted">
            Share with your partner — updates when you change the plan.
          </p>
        </div>
      </div>
      <p className="mt-4 break-all rounded-xl bg-shell px-3 py-2 font-mono text-xs text-ink">
        {feedUrl}
      </p>
      <p className="mt-2 text-xs text-muted">
        In Apple Calendar: Settings → Calendar → Add Subscribed Calendar. Use{" "}
        <strong>https://</strong> only (not webcal).
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/10 py-2.5 text-sm font-medium"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={share}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral py-2.5 text-sm font-medium text-white"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
      <form
        action={async () => {
          await rotateIcsToken();
        }}
        className="mt-3"
      >
        <button
          type="submit"
          className="text-xs text-muted underline"
        >
          Rotate link (invalidates old URL)
        </button>
      </form>
    </div>
  );
}
