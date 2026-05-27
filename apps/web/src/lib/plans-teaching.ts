export const PLANS_TEACHING_SEEN_KEY = "ruffles-plans-teaching-seen";

export function hasSeenPlansTeaching(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(PLANS_TEACHING_SEEN_KEY) === "1";
}

export function markPlansTeachingSeen(): void {
  localStorage.setItem(PLANS_TEACHING_SEEN_KEY, "1");
}

export function trackEmptyState(event: string) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${event}`);
  }
}
