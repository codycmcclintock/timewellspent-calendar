import { createClient } from "@/lib/supabase/server";
import { getUserContext, ensureIcsToken } from "@/lib/user-context";
import { feedUrl } from "@/lib/ics-export";
import { CalendarLinkCard } from "@/components/CalendarLinkCard";
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

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/onboarding?join=${couple?.invite_token}`;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-muted">{ctx.profile.display_name}</p>
      </section>

      <CalendarLinkCard feedUrl={url} />

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="font-semibold text-ink">Invite partner</h3>
        <p className="mt-1 break-all font-mono text-xs text-muted">{inviteUrl}</p>
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
