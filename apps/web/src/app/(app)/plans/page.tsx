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
          <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-black/5">
            No plans yet. Finish onboarding to import Joshua Tree.
          </p>
        )}
      </div>
    </div>
  );
}
