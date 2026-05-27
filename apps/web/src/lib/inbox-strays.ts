import type { Draft } from "@/lib/types";

export type StrayCategory = "no_location" | "need_trip";

export function categorizeStrayDraft(draft: Draft): StrayCategory {
  const meta = (draft.raw_metadata ?? {}) as Record<string, unknown>;
  const dest = typeof meta.destination === "string" ? meta.destination : null;
  const key =
    typeof meta.destination_key === "string" ? meta.destination_key : null;
  const parseStatus = meta.parse_status;

  if (
    parseStatus === "no_location" ||
    !key ||
    key === "trip-ideas" ||
    dest === "Trip ideas" ||
    !dest
  ) {
    return "no_location";
  }
  return "need_trip";
}

export function strayDestinationLabel(draft: Draft): string {
  const meta = (draft.raw_metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.destination === "string") return meta.destination;
  return draft.place_name ?? "Trip ideas";
}
