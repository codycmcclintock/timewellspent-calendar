import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { PlansHub } from "@/components/plans/PlansHub";
import { MatchedIdeasPanel } from "@/components/plans/MatchedIdeasPanel";
import { getMatchedDrafts } from "@/app/actions";
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
    .order("created_at", { ascending: false });

  const planList = (plans ?? []) as Plan[];
  const planIds = planList.map((p) => p.id);

  const unsortedCounts: Record<string, number> = {};
  if (planIds.length > 0) {
    const { data: drafts } = await supabase
      .from("drafts")
      .select("plan_id")
      .eq("couple_id", ctx.coupleId)
      .in("plan_id", planIds)
      .is("suggested_day", null);

    for (const row of drafts ?? []) {
      if (row.plan_id) {
        unsortedCounts[row.plan_id] = (unsortedCounts[row.plan_id] ?? 0) + 1;
      }
    }
  }

  let matches: Awaited<ReturnType<typeof getMatchedDrafts>> = [];
  try {
    matches = await getMatchedDrafts();
  } catch {
    /* migration 006 may not be applied */
  }

  return (
    <>
      <MatchedIdeasPanel matches={matches} />
      <PlansHub
        plans={planList}
        unsortedCounts={unsortedCounts}
        hasPartner={!!ctx.partner}
      />
    </>
  );
}
