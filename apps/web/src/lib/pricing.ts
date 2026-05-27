/** MVP pricing — one paywall: saved reels to your inbox. */

export const FREE_INBOX_REEL_SAVES_PER_MONTH = 15;

export const PRO_PRICE_MONTHLY = 4.99;
export const PRO_PRICE_YEARLY = 39;

export function isProSubscriber(isPro?: boolean): boolean {
  return isPro === true || process.env.RUFFLES_DEMO_PRO === "true";
}

export function canSaveReel(inboxSavesThisMonth: number, isPro?: boolean): boolean {
  if (isProSubscriber(isPro)) return true;
  return inboxSavesThisMonth < FREE_INBOX_REEL_SAVES_PER_MONTH;
}

export function reelSavesRemaining(
  inboxSavesThisMonth: number,
  isPro?: boolean,
): number | null {
  if (isProSubscriber(isPro)) return null;
  return Math.max(0, FREE_INBOX_REEL_SAVES_PER_MONTH - inboxSavesThisMonth);
}
