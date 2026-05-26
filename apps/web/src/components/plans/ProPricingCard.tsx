"use client";

import {
  FREE_INBOX_REEL_SAVES_PER_MONTH,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  reelSavesRemaining,
} from "@/lib/pricing";

export function ProPricingCard({
  isPro,
  inboxSavesThisMonth,
}: {
  isPro: boolean;
  inboxSavesThisMonth: number;
}) {
  const remaining = reelSavesRemaining(inboxSavesThisMonth, isPro);

  if (isPro) {
    return (
      <section className="rounded-2xl bg-gold/10 p-4 ring-1 ring-gold/30">
        <p className="font-serif font-semibold text-ink">Ruffles Pro</p>
        <p className="mt-1 text-sm text-muted">Unlimited reel saves — you&apos;re set.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Free plan
      </p>
      <ul className="mt-2 space-y-1 text-sm text-ink">
        <li>Unlimited trips &amp; people</li>
        <li>Voice + AI day planning</li>
        <li>Match notifications</li>
        <li>
          {remaining ?? 0} of {FREE_INBOX_REEL_SAVES_PER_MONTH} reel saves left
          this month
        </li>
      </ul>
      <div className="mt-4 border-t border-black/5 pt-4">
        <p className="font-serif font-semibold text-ink">Ruffles Pro</p>
        <p className="text-sm text-muted">Unlimited saved reels</p>
        <p className="mt-1 text-lg font-semibold text-primary-500">
          ${PRO_PRICE_YEARLY}/yr
          <span className="text-xs font-normal text-muted">
            {" "}
            · ${PRO_PRICE_MONTHLY}/mo
          </span>
        </p>
      </div>
    </section>
  );
}
