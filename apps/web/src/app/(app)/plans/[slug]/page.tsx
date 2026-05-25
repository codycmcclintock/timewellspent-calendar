import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext, ensureIcsToken } from "@/lib/user-context";
import { TripItineraryView } from "@/components/TripItineraryView";
import { PlanWishlistView } from "@/components/plans/PlanWishlistView";
import { ensureJoshuaTreeItinerary } from "@/app/actions";
import { joinInviteUrl } from "@/lib/app-url";
import { isJoshuaTreePlan } from "@/lib/plan-utils";
import { redirect } from "next/navigation";
import type { CalendarEvent, Draft, Plan } from "@/lib/types";

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { slug } = await params;
  const { day: dayParam } = await searchParams;
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  let { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .eq("slug", slug)
    .maybeSingle();

  if (!plan && slug === "joshua-tree") {
    const { data: created } = await supabase
      .from("plans")
      .insert({
        couple_id: ctx.coupleId,
        slug: "joshua-tree",
        title: "Joshua Tree",
        destination: "Joshua Tree",
        destination_key: "joshua-tree",
        status: "scheduled",
        description:
          "Desert weekend — horses, hikes, farmers market, and dinners under the stars.",
        starts_on: "2026-05-15",
        ends_on: "2026-05-18",
        trip_length_days: 4,
        date_mode: "exact",
        cover_image_url:
          "https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=1200&q=80",
        day_themes: {
          "2026-05-15": { title: "Slow LA night", subtitle: "Relax, fuel up, sleep early." },
          "2026-05-16": { title: "LA → Joshua Tree", subtitle: "Market, art, Transmission sunset." },
          "2026-05-17": { title: "Sunrise horseback → hikes → dinner", subtitle: "The big day." },
          "2026-05-18": { title: "Laguna reset", subtitle: "Ocean, gym, work day." },
        },
      })
      .select()
      .single();
    plan = created;
  }

  if (!plan) redirect("/plans");

  let { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("plan_id", plan.id)
    .order("starts_at");

  if (slug === "joshua-tree" && (!events || events.length === 0)) {
    try {
      await ensureJoshuaTreeItinerary();
      const { data: refreshed } = await supabase
        .from("events")
        .select("*")
        .eq("plan_id", plan.id)
        .order("starts_at");
      events = refreshed;
    } catch {
      /* optional */
    }
  }

  if (slug === "joshua-tree" && plan.starts_on && !dayParam) {
    redirect(`/plans/joshua-tree?day=${plan.starts_on}`);
  }

  const { data: drafts } = await supabase
    .from("drafts")
    .select("*")
    .eq("plan_id", plan.id)
    .order("created_at", { ascending: false });

  const { data: couple } = await supabase
    .from("couples")
    .select("invite_token")
    .eq("id", ctx.coupleId)
    .single();

  const inviteUrl = couple?.invite_token
    ? joinInviteUrl(couple.invite_token)
    : undefined;

  await ensureIcsToken(ctx.userId);

  const typedPlan = plan as Plan;
  const useWishlist = !isJoshuaTreePlan(slug);

  return (
    <Suspense fallback={null}>
      {useWishlist ? (
        <PlanWishlistView
          plan={typedPlan}
          drafts={(drafts ?? []) as Draft[]}
          events={(events ?? []) as CalendarEvent[]}
          inviteUrl={inviteUrl}
          showPartnerInvite={!ctx.partner}
          isPro={ctx.isPro ?? false}
        />
      ) : (
        <TripItineraryView
          plan={typedPlan}
          events={(events ?? []) as CalendarEvent[]}
          inviteUrl={inviteUrl}
          showPartnerInvite={!ctx.partner}
        />
      )}
    </Suspense>
  );
}
