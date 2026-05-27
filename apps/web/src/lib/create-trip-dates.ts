import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  nextFriday,
  startOfMonth,
  startOfWeek,
  type Day,
} from "date-fns";
import type { WhenSelection } from "@/components/plans/PlanWhenPicker";

export type QuickWhenId =
  | "this_weekend"
  | "next_weekend"
  | "two_weeks"
  | "flexible";

export type QuickWhenOption = {
  id: QuickWhenId;
  label: string;
  sublabel: string;
  when: {
    dateMode: "flexible_month" | "exact";
    startsOn?: string;
    endsOn?: string;
    flexibleMonth?: string;
    tripLengthDays: number;
  };
};

function toIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function buildQuickWhenOptions(weekStartsOn: Day = 1): QuickWhenOption[] {
  const now = new Date();
  const thisFri = nextFriday(now);
  const thisSun = endOfWeek(thisFri, { weekStartsOn });
  const nextFri = addWeeks(thisFri, 1);
  const nextSun = endOfWeek(nextFri, { weekStartsOn });
  const twoFri = addWeeks(thisFri, 2);
  const twoSun = endOfWeek(twoFri, { weekStartsOn });

  const nights = (a: Date, b: Date) =>
    Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));

  return [
    {
      id: "this_weekend",
      label: "This weekend",
      sublabel: `Fri–Sun · ${nights(thisFri, thisSun)} nights`,
      when: {
        dateMode: "exact",
        startsOn: toIso(thisFri),
        endsOn: toIso(thisSun),
        tripLengthDays: nights(thisFri, thisSun),
      },
    },
    {
      id: "next_weekend",
      label: "Next weekend",
      sublabel: `${format(nextFri, "MMM d")}–${format(nextSun, "d")} · ${nights(nextFri, nextSun)} nights`,
      when: {
        dateMode: "exact",
        startsOn: toIso(nextFri),
        endsOn: toIso(nextSun),
        tripLengthDays: nights(nextFri, nextSun),
      },
    },
    {
      id: "two_weeks",
      label: "In 2 weeks",
      sublabel: "Fri–Sun",
      when: {
        dateMode: "exact",
        startsOn: toIso(twoFri),
        endsOn: toIso(twoSun),
        tripLengthDays: nights(twoFri, twoSun),
      },
    },
    {
      id: "flexible",
      label: "I'm flexible",
      sublabel: "Pick later",
      when: {
        dateMode: "flexible_month",
        flexibleMonth: format(addWeeks(startOfWeek(now, { weekStartsOn }), 4), "yyyy-MM"),
        tripLengthDays: 3,
      },
    },
  ];
}

export function formatWhenSummary(when: QuickWhenOption["when"]): string {
  if (when.dateMode === "flexible_month" && !when.startsOn) {
    return "Dates flexible";
  }
  if (when.startsOn && when.endsOn) {
    return `${format(new Date(when.startsOn), "MMM d")}–${format(new Date(when.endsOn), "MMM d")}`;
  }
  if (when.startsOn) {
    return format(new Date(when.startsOn), "MMM d, yyyy");
  }
  return "Dates TBD";
}

export function nightCount(
  startsOn?: string | null,
  endsOn?: string | null,
): number {
  if (!startsOn || !endsOn) return 0;
  const a = new Date(startsOn);
  const b = new Date(endsOn);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function whenCanContinue(when: {
  dateMode: string;
  startsOn?: string;
}): boolean {
  return when.dateMode === "flexible_month" || !!when.startsOn;
}

export function buildFlexibleMonthOptions(count = 12) {
  const base = startOfMonth(new Date());
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(base, i);
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "MMM yyyy"),
      short: format(d, "MMM"),
    };
  });
}

export function whenCtaLabel(when: WhenSelection): string {
  if (when.dateMode === "flexible_month" && !when.startsOn) {
    const monthLabel = when.flexibleMonth
      ? format(new Date(`${when.flexibleMonth}-01`), "MMMM")
      : "flexible";
    const nights = when.tripLengthDays ?? 3;
    return `Continue · ${nights} night${nights === 1 ? "" : "s"} in ${monthLabel}`;
  }
  const nights = nightCount(when.startsOn, when.endsOn);
  if (nights > 0) {
    const range =
      when.startsOn && when.endsOn
        ? `${format(new Date(when.startsOn), "MMM d")}–${format(new Date(when.endsOn), "MMM d")}`
        : "";
    return range ? `Continue · ${range}` : `Continue · ${nights} night${nights === 1 ? "" : "s"}`;
  }
  if (when.startsOn) return "Continue · 1 night";
  return "Continue →";
}
