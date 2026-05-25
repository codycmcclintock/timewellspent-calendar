import { addDays, format, parseISO } from "date-fns";
import type { Plan } from "@/lib/types";

export function planDayKeys(plan: Plan): string[] {
  if (!plan.starts_on) return [];
  const start = parseISO(plan.starts_on);
  const end = plan.ends_on ? parseISO(plan.ends_on) : start;
  const keys: string[] = [];
  let d = start;
  while (d <= end) {
    keys.push(format(d, "yyyy-MM-dd"));
    d = addDays(d, 1);
  }
  return keys;
}

export function dayKeyFromIso(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}
