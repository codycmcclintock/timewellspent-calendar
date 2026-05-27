import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { joinInviteUrl } from "@/lib/app-url";
import { CreateTripFlow } from "@/components/plans/create-trip/CreateTripFlow";
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
    <CreateTripFlow
      inviteUrl={inviteUrl}
      inviteToken={couple?.invite_token ?? null}
    />
  );
}
