export function destinationKeyFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function uniquePlanSlug(destinationKey: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${destinationKey}-${suffix}`;
}

export function isJoshuaTreePlan(slug: string) {
  return slug === "joshua-tree";
}

export function isWishlistPlan(plan: { slug: string; status?: string | null }) {
  return !isJoshuaTreePlan(plan.slug) && plan.status !== "scheduled";
}
