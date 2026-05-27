import type { Plan } from "@/lib/types";

/** Match a parsed destination to an existing couple plan (no auto-create). */
export function normalizeDestinationKey(key: string): string {
  return key.trim().toLowerCase();
}

export function planMatchesDestination(
  plan: Pick<Plan, "destination_key" | "destination" | "slug">,
  destinationKey: string,
  destinationLabel?: string,
): boolean {
  const key = normalizeDestinationKey(destinationKey);
  if (plan.destination_key && normalizeDestinationKey(plan.destination_key) === key) {
    return true;
  }
  if (plan.slug === key) return true;
  if (
    destinationLabel &&
    plan.destination?.toLowerCase() === destinationLabel.toLowerCase()
  ) {
    return true;
  }
  return false;
}
