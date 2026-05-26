"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CALENDAR_SHARE_HELP,
  CALENDAR_SHARE_PHONE,
} from "@/lib/partner-copy";

export function SharedCalendarBlock({
  feedUrl,
  eventCount,
}: {
  feedUrl: string;
  eventCount: number;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const httpsUrl = feedUrl.replace(/^http:\/\//i, "https://");

  return (
    <section className="rounded-2xl bg-[#1a1a1a] p-5 text-white">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
        Shared calendar
      </p>
      <p className="mt-1 font-serif text-xl font-semibold">Time Well Spent ❤️</p>
      <p className="mt-2 text-sm leading-relaxed text-white/75">
        Every experience. Every &quot;let&apos;s actually do it&quot; moment. Download{" "}
        {CALENDAR_SHARE_PHONE}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={httpsUrl}
          download="timewellspent.ics"
          className="flex-1 rounded-full bg-white py-2.5 text-center text-sm font-semibold text-ink"
        >
          Download .ics file
        </a>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="flex-1 rounded-full border border-white/30 py-2.5 text-sm font-semibold text-white"
        >
          {CALENDAR_SHARE_HELP}
        </button>
      </div>
      {showHelp ? (
        <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs leading-relaxed text-white/90">
          <p>
            On iPhone: Settings → Calendar → Accounts → Add Account → Other → Add
            Subscribed Calendar. Paste the link from{" "}
            <Link href="/profile" className="underline">
              Profile
            </Link>
            . Use <strong>https://</strong> only.
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-center text-xs text-white/50">
        Time Well Spent ❤️ · {eventCount} events
      </p>
    </section>
  );
}
