import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { PlanCard } from "@/components/PlanCard";
import { redirect } from "next/navigation";
import type { Plan } from "@/lib/types";

export default async function PlansPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .order("created_at");

  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold">Plans</h2>
      <p className="mt-1 text-sm text-muted">Trips and adventures you&apos;re building.</p>
      <div className="mt-6 space-y-4">
        {(plans as Plan[] | null)?.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
        {(!plans || plans.length === 0) && (
          <a
            href="/plans/joshua-tree"
            className="block overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5"
          >
            <div
              className="relative h-44 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=800&q=80)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-xl font-bold text-white">Joshua Tree</p>
                <p className="mt-1 text-sm text-white/90">
                  Tap to speak your trip or import the full calendar →
                </p>
              </div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
