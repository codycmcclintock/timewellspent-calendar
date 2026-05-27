import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/server";
import { joinInviteUrl } from "@/lib/app-url";
import { isDevToolsEnabled } from "@/lib/is-dev-tools";
import { FREE_INBOX_REEL_SAVES_PER_MONTH } from "@/lib/pricing";
import { SettingsDevPanel } from "@/components/SettingsDevPanel";

export default async function SettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const { data: couple } = await supabase
    .from("couples")
    .select("invite_token, is_pro")
    .eq("id", ctx.coupleId)
    .single();

  const inviteUrl = couple?.invite_token
    ? joinInviteUrl(couple.invite_token)
    : null;

  const isPro = ctx.isPro ?? couple?.is_pro ?? false;
  const showDev = isDevToolsEnabled();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Account and app info</p>
      </div>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <p className="text-sm font-medium text-ink">Plan</p>
        <p className="mt-1 text-sm text-muted">
          {isPro
            ? "Ruffles Pro — unlimited reel saves"
            : `${FREE_INBOX_REEL_SAVES_PER_MONTH} free reel saves per month`}
        </p>
        {!ctx.partner && inviteUrl ? (
          <Link
            href="/profile"
            className="mt-3 inline-block text-sm font-medium text-primary-500"
          >
            Invite your partner →
          </Link>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <p className="text-sm font-medium text-ink">Environment</p>
        <dl className="mt-2 space-y-2 text-xs">
          <div>
            <dt className="text-muted">App URL</dt>
            <dd className="mt-0.5 break-all font-mono text-ink">
              {process.env.NEXT_PUBLIC_APP_URL ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Supabase URL</dt>
            <dd className="mt-0.5 break-all font-mono text-ink">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {showDev ? <SettingsDevPanel /> : null}
    </div>
  );
}
