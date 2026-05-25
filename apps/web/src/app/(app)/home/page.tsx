import { Suspense } from "react";
import { addDays, endOfWeek, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { HomeTabs } from "@/components/HomeTabs";
import {
  getWeekStart,
  parseWeekParam,
  dayRangeISO,
} from "@/lib/dates";
import type { CalendarEvent, Draft } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const today = startOfDay(new Date());
  const { start: todayStart, end: todayEnd } = dayRangeISO(today);

  const weekStart = parseWeekParam(params.week ?? null);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const [{ data: todayEvents }, { data: weekEvents }, { data: upcomingEvents }, { data: drafts }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("couple_id", ctx.coupleId)
        .gte("starts_at", todayStart)
        .lte("starts_at", todayEnd)
        .order("starts_at"),
      supabase
        .from("events")
        .select("*")
        .eq("couple_id", ctx.coupleId)
        .gte("starts_at", weekStart.toISOString())
        .lte("starts_at", weekEnd.toISOString())
        .order("starts_at"),
      supabase
        .from("events")
        .select("*")
        .eq("couple_id", ctx.coupleId)
        .gte("starts_at", addDays(today, 1).toISOString())
        .order("starts_at")
        .limit(20),
      supabase
        .from("drafts")
        .select("*")
        .eq("couple_id", ctx.coupleId)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <HomeTabs
        todayEvents={(todayEvents ?? []) as CalendarEvent[]}
        weekEvents={(weekEvents ?? []) as CalendarEvent[]}
        upcomingEvents={(upcomingEvents ?? []) as CalendarEvent[]}
        drafts={(drafts ?? []) as Draft[]}
        coupleId={ctx.coupleId}
        userId={ctx.userId}
        weekStart={weekStart}
        today={today}
      />
    </Suspense>
  );
}
