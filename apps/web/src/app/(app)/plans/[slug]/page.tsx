import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext, ensureIcsToken } from "@/lib/user-context";
import { TripItineraryView } from "@/components/TripItineraryView";
import { redirect } from "next/navigation";
import type { CalendarEvent, Plan } from "@/lib/types";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
        description:
          "Desert weekend — horses, hikes, farmers market, and dinners under the stars.",
        starts_on: "2026-05-15",
        ends_on: "2026-05-18",
        cover_image_url:
          "https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=1200&q=80",
        day_themes: {
          "2026-05-15": { title: "Slow LA night", subtitle: "Relax, fuel up, sleep early." },
          "2026-05-16": { title: "Desert arrival", subtitle: "Market, camp, stargaze." },
          "2026-05-17": { title: "Sunrise horseback → hikes → dinner", subtitle: "The big day." },
          "2026-05-18": { title: "Laguna reset", subtitle: "Ocean, gym, work day." },
        },
      })
      .select()
      .single();
    plan = created;
  }

  if (!plan) redirect("/plans");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("plan_id", plan.id)
    .order("starts_at");

  const token = await ensureIcsToken(ctx.userId);
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const feedUrl = `${base}/api/feed/${token}.ics`;

  return (
    <Suspense fallback={null}>
      <TripItineraryView
        plan={plan as Plan}
        events={(events ?? []) as CalendarEvent[]}
        feedUrl={feedUrl}
      />
    </Suspense>
  );
}
