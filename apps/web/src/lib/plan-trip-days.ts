import { eachDayOfInterval, format, parseISO } from "date-fns";
import type { Plan } from "@/lib/types";

export function planTripDayKeys(plan: Plan): string[] {
  if (plan.starts_on && plan.ends_on) {
    return eachDayOfInterval({
      start: parseISO(plan.starts_on),
      end: parseISO(plan.ends_on),
    }).map((d) => format(d, "yyyy-MM-dd"));
  }
  if (plan.starts_on) return [plan.starts_on];
  return [];
}

export function tripDensityThreshold(plan: Plan, dayCount: number): number {
  const budget = dayCount || plan.trip_length_days || 3;
  return budget * 3;
}
