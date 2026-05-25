import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { ScheduleActivityCard } from "@/components/ScheduleActivityCard";
import { notFound, redirect } from "next/navigation";
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
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .eq("slug", slug)
    .single();

  if (!plan) notFound();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("plan_id", plan.id)
    .order("starts_at");

  const p = plan as Plan;

  return (
    <div>
      <div className="relative -mx-4 mb-6 h-52 overflow-hidden">
        {p.cover_image_url && (
          <img
            src={p.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-serif text-3xl font-semibold text-white">
            {p.title}
          </h1>
        </div>
      </div>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Schedule overview
        </h2>
        <p className="mt-2 text-sm text-ink">
          {p.description ?? "Your shared adventure."}
        </p>
      </section>

      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-ink">On the calendar</h2>
        {(events as CalendarEvent[] | null)?.length ? (
          <div className="space-y-3">
            {(events as CalendarEvent[]).map((e) => (
              <ScheduleActivityCard
                key={e.id}
                event={e}
                userId={ctx.userId}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted ring-1 ring-black/5">
            Nothing scheduled for this plan yet — add from Today or This Week.
          </p>
        )}
      </div>
    </div>
  );
}
