import {
  addDays,
  addWeeks,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";

export const DISPLAY_TZ = "America/Los_Angeles";

export function getWeekStart(date: Date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function formatWeekLabel(weekStart: Date) {
  const end = addDays(weekStart, 6);
  return `${format(weekStart, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function parseWeekParam(param: string | null): Date {
  if (!param) return getWeekStart();
  try {
    return startOfWeek(parseISO(param), { weekStartsOn: 1 });
  } catch {
    return getWeekStart();
  }
}

export function weekStartISO(weekStart: Date) {
  return format(weekStart, "yyyy-MM-dd");
}

export function prevWeek(weekStart: Date) {
  return subWeeks(weekStart, 1);
}

export function nextWeek(weekStart: Date) {
  return addWeeks(weekStart, 1);
}

export function dayRangeISO(date: Date) {
  return {
    start: startOfDay(date).toISOString(),
    end: endOfDay(date).toISOString(),
  };
}

export function formatTime(iso: string) {
  return format(parseISO(iso), "h:mm a");
}

export function formatDayHeader(date: Date) {
  return format(date, "EEEE, MMMM d");
}

export function getDayPeriod(hour: number): "Morning" | "Afternoon" | "Evening" {
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export const WEEKDAY_COLUMNS: { left: number[]; right: number[] } = {
  left: [1, 3, 5],
  right: [2, 4, 6],
};
