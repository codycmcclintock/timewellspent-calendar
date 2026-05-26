import { Suspense } from "react";
import { addDays, endOfWeek, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { HomeTabs } from "@/components/HomeTabs";
import { PartnerInviteBanner } from "@/components/PartnerInviteBanner";
import { FeaturedTripCard } from "@/components/FeaturedTripCard";
import { HomeHeartbeat } from "@/components/HomeHeartbeat";
import { joinInviteUrl } from "@/lib/app-url";
import {
  getWeekStart,
  parseWeekParam,
  dayRangeISO,
} from "@/lib/dates";
import type { CalendarEvent, Draft, Plan } from "@/lib/types";
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

  const todayIso = today.toISOString().slice(0, 10);

  const [
    { data: todayEvents },
    { data: weekEvents },
    { data: upcomingEvents },
    { data: drafts },
    { data: couple },
    { data: nextPlan },
    { data: recentMoment },
    { data: partnerEvents },
  ] = await Promise.all([
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
    supabase
      .from("couples")
      .select("invite_token")
      .eq("id", ctx.coupleId)
      .single(),
    supabase
      .from("plans")
      .select("*")
      .eq("couple_id", ctx.coupleId)
      .or(`starts_on.gte.${todayIso},slug.eq.joshua-tree`)
      .order("starts_on", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("*")
      .eq("couple_id", ctx.coupleId)
      .lt("starts_at", today.toISOString())
      .not("description", "is", null)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.partner
      ? supabase
          .from("events")
          .select("*")
          .eq("couple_id", ctx.coupleId)
          .eq("created_by", ctx.partner.id)
          .gte("starts_at", today.toISOString())
          .order("starts_at")
          .limit(1)
      : Promise.resolve({ data: null }),
  ]);

  const inviteUrl = couple?.invite_token
    ? joinInviteUrl(couple.invite_token)
    : null;

  const showTripCard = today < new Date("2026-05-19");

  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      {!ctx.partner && inviteUrl ? (
        <PartnerInviteBanner inviteUrl={inviteUrl} />
      ) : null}

      <HomeHeartbeat
        nextPlan={(nextPlan as Plan) ?? null}
        recentMoment={(recentMoment as CalendarEvent) ?? null}
        partnerNextEvent={(partnerEvents?.[0] as CalendarEvent) ?? null}
        partnerName={ctx.partner?.display_name ?? null}
      />

      {showTripCard ? (
        <FeaturedTripCard
          href="/plans/joshua-tree"
          title="Joshua Tree"
          dates="May 15–18, 2026"
          subtitle="Desert weekend — your full itinerary is ready."
          coverImageUrl="https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=800&q=80"
        />
      ) : null}

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
