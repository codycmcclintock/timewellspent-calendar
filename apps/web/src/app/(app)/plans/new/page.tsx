import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { joinInviteUrl } from "@/lib/app-url";
import { NewPlanWizard } from "@/components/plans/NewPlanWizard";
import { redirect } from "next/navigation";

export default async function NewPlanPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const { data: couple } = await supabase
    .from("couples")
    .select("invite_token")
    .eq("id", ctx.coupleId)
    .single();

  const inviteUrl = couple?.invite_token
    ? joinInviteUrl(couple.invite_token)
    : null;

  return (
    <NewPlanWizard
      inviteUrl={inviteUrl}
      hasPartner={!!ctx.partner}
      partnerName={ctx.partner?.display_name ?? null}
    />
  );
}
