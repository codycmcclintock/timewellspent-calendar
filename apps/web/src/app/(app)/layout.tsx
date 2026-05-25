export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getUserContext } from "@/lib/user-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-24">
      <header className="sticky top-0 z-40 border-b border-[#b85c38]/10 bg-[#f7f4ef]/95 px-4 py-3 backdrop-blur">
        <p className="font-serif text-lg font-semibold">Ruffles</p>
        <p className="text-xs text-muted">
          Hi, {ctx.profile.display_name ?? "there"}
          {ctx.partner ? ` · with ${ctx.partner.display_name}` : ""}
        </p>
      </header>
      <main className="px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
