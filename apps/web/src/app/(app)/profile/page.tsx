import { createClient } from "@/lib/supabase/server";
import { getUserContext, ensureIcsToken } from "@/lib/user-context";
import { feedUrl } from "@/lib/ics-export";
import { joinInviteUrl } from "@/lib/app-url";
import { CalendarLinkCard } from "@/components/CalendarLinkCard";
import { PartnerInviteBanner } from "@/components/PartnerInviteBanner";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import type { Todo } from "@/lib/types";
import { TodoList } from "@/components/TodoList";

export default async function ProfilePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const token = await ensureIcsToken(ctx.userId);
  const url = feedUrl(token);

  const supabase = await createClient();
  const { data: couple } = await supabase
    .from("couples")
    .select("invite_token, name")
    .eq("id", ctx.coupleId)
    .single();

  const inviteUrl = couple?.invite_token
    ? joinInviteUrl(couple.invite_token)
    : null;

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-muted">{ctx.profile.display_name}</p>
        {ctx.partner ? (
          <p className="mt-1 text-sm text-ink/80">
            Planning with {ctx.partner.display_name}
          </p>
        ) : null}
      </section>

      {!ctx.partner && inviteUrl ? (
        <PartnerInviteBanner inviteUrl={inviteUrl} />
      ) : null}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted">
          Also add to Apple Calendar
        </h3>
        <CalendarLinkCard feedUrl={url} />
      </section>

      <TodoList initialTodos={(todos ?? []) as Todo[]} />

      <form action={signOut}>
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
