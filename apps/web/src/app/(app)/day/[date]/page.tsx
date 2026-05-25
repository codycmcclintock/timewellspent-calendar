import { parseISO, startOfDay } from "date-fns";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { dayRangeISO, formatDayHeader, getDayPeriod } from "@/lib/dates";
import { ScheduleActivityCard } from "@/components/ScheduleActivityCard";
import { redirect } from "next/navigation";
import type { CalendarEvent } from "@/lib/types";

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { date: dateStr } = await params;
  const { event: openEventId } = await searchParams;
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const date = startOfDay(parseISO(dateStr));
  const { start, end } = dayRangeISO(date);

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .gte("starts_at", start)
    .lte("starts_at", end)
    .order("starts_at");

  const list = (events ?? []) as CalendarEvent[];
  const periods = ["Morning", "Afternoon", "Evening"] as const;

  const grouped = periods.map((period) => ({
    period,
    events: list.filter((e) => {
      const hour = new Date(e.starts_at).getHours();
      return getDayPeriod(hour) === period;
    }),
  }));

  return (
    <div>
      <Link
        href="/home?tab=today"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-serif text-2xl font-semibold">{formatDayHeader(date)}</h1>
      <p className="text-sm text-muted">Map of the day</p>

      <div className="mt-6 space-y-8">
        {grouped.map(
          ({ period, events: periodEvents }) =>
            periodEvents.length > 0 && (
              <section key={period}>
                <h2 className="border-b border-ink pb-1 text-xs font-bold tracking-widest text-ink">
                  {period.toUpperCase()}
                </h2>
                <div className="mt-3 space-y-3">
                  {periodEvents.map((e) => (
                    <ScheduleActivityCard
                      key={e.id}
                      event={e}
                      userId={ctx.userId}
                      defaultOpen={e.id === openEventId}
                    />
                  ))}
                </div>
              </section>
            ),
        )}
        {list.length === 0 && (
          <p className="text-center text-muted">No events this day.</p>
        )}
      </div>
    </div>
  );
}
