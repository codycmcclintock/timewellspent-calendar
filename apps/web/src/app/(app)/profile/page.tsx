import { createClient } from "@/lib/supabase/server";
import { getUserContext, ensureIcsToken } from "@/lib/user-context";
import { feedUrl } from "@/lib/ics-export";
import { joinInviteUrl } from "@/lib/app-url";
import { CoupleDashboard } from "@/components/CoupleDashboard";
import { SavedInbox } from "@/components/plans/SavedInbox";
import { ProPricingCard } from "@/components/plans/ProPricingCard";
import { redirect } from "next/navigation";
import { signOut, getInboxReelSaveCount } from "@/app/actions";
import type { Draft, Plan, Todo } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

export default async function ProfilePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const token = await ensureIcsToken(ctx.userId);
  const url = feedUrl(token);

  const supabase = await createClient();
  const { data: couple } = await supabase
    .from("couples")
    .select("invite_token, name, created_at, is_pro")
    .eq("id", ctx.coupleId)
    .single();

  const [{ data: drafts }, { data: plans }] = await Promise.all([
    supabase
      .from("drafts")
      .select("*")
      .eq("couple_id", ctx.coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("plans")
      .select("id, slug, title, destination, destination_key")
      .eq("couple_id", ctx.coupleId)
      .order("created_at", { ascending: false }),
  ]);

  const inboxSavesThisMonth = await getInboxReelSaveCount();
  const isPro = ctx.isPro ?? couple?.is_pro ?? false;

  const inviteUrl = couple?.invite_token
    ? joinInviteUrl(couple.invite_token)
    : null;

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const { data: firstEvent } = await supabase
    .from("events")
    .select("created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const anchor = firstEvent?.created_at ?? couple?.created_at;
  const daysTogether = anchor
    ? Math.max(0, differenceInDays(new Date(), parseISO(anchor)))
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const { data: nextPlan } = await supabase
    .from("plans")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .or(`starts_on.gte.${today},ends_on.gte.${today}`)
    .order("starts_on", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <CoupleDashboard
        profile={ctx.profile}
        partner={ctx.partner}
        coupleName={couple?.name ?? null}
        daysTogether={daysTogether}
        nextPlan={(nextPlan as Plan) ?? null}
        feedUrl={url}
        inviteUrl={inviteUrl}
        todos={(todos ?? []) as Todo[]}
      />

      <div className="mt-8 space-y-6">
        <SavedInbox
          drafts={(drafts ?? []) as Draft[]}
          plans={(plans ?? []) as Plan[]}
          inboxSavesThisMonth={inboxSavesThisMonth}
          isPro={isPro}
        />
        <ProPricingCard isPro={isPro} inboxSavesThisMonth={inboxSavesThisMonth} />
      </div>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="w-full rounded-full border border-black/10 py-3 text-sm font-medium text-muted"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
