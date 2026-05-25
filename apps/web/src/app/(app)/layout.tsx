export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { getUserContext } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const { data: couple } = await supabase
    .from("couples")
    .select("invite_token")
    .eq("id", ctx.coupleId)
    .single();

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-shell pb-24">
      <AppHeader
        displayName={ctx.profile.display_name}
        partnerName={ctx.partner?.display_name ?? null}
        showInviteLink={!ctx.partner}
      />
      <main className="px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
