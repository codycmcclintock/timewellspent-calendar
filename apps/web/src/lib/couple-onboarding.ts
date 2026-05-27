import { randomBytes } from "crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

async function ensureProfileWithService(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
) {
  const { data: existing } = await service
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "User";

  const { error: profileError } = await service.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    avatar_url:
      typeof meta.avatar_url === "string" ? meta.avatar_url : null,
  });
  if (profileError) throw profileError;

  const { error: notifError } = await service
    .from("notification_preferences")
    .insert({ user_id: user.id, email_on_us_events: true });
  if (notifError && notifError.code !== "23505") throw notifError;
}

async function getCoupleMemberCount(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  coupleId: string,
) {
  const { count } = await service
    .from("couple_members")
    .select("user_id", { count: "exact", head: true })
    .eq("couple_id", coupleId);
  return count ?? 0;
}

export async function createCoupleCore(
  user: User,
  options?: { name?: string },
): Promise<string> {
  const service = await createServiceClient();
  await ensureProfileWithService(service, user);

  const { data: existingMember } = await service
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember?.couple_id) return existingMember.couple_id;

  const { data: couple, error } = await service
    .from("couples")
    .insert({ name: options?.name ?? "Our plans", created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  const { error: memberError } = await service.from("couple_members").insert({
    couple_id: couple.id,
    user_id: user.id,
    role: "member",
  });
  if (memberError) throw memberError;

  const { data: tokenRow } = await service
    .from("ics_feed_tokens")
    .select("token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tokenRow) {
    const token = randomBytes(24).toString("hex");
    const { error: tokenError } = await service
      .from("ics_feed_tokens")
      .insert({ user_id: user.id, token });
    if (tokenError) throw tokenError;
  }

  return couple.id;
}

export async function joinCoupleCore(
  user: User,
  supabase: SupabaseClient,
  inviteToken: string,
): Promise<string> {
  const service = await createServiceClient();
  await ensureProfileWithService(service, user);

  const { data: inviterCouple } = await service
    .from("couples")
    .select("id")
    .eq("invite_token", inviteToken)
    .single();

  if (!inviterCouple) throw new Error("Invalid invite");

  const inviterCount = await getCoupleMemberCount(service, inviterCouple.id);
  if (inviterCount >= 2) {
    throw new Error(
      "This invite link is full — the calendar already has two people.",
    );
  }

  const { data: existing } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.couple_id === inviterCouple.id) {
    return inviterCouple.id;
  }

  if (existing) {
    const currentCount = await getCoupleMemberCount(service, existing.couple_id);
    if (currentCount >= 2) {
      throw new Error(
        "You're already on a shared calendar with someone else. Leave that space before joining a new one.",
      );
    }
    if (currentCount === 1) {
      const { error: joinErr } = await service.from("couple_members").insert({
        couple_id: inviterCouple.id,
        user_id: user.id,
      });
      if (joinErr) throw joinErr;

      const { error: leaveErr } = await service
        .from("couple_members")
        .delete()
        .eq("couple_id", existing.couple_id)
        .eq("user_id", user.id);
      if (leaveErr) throw leaveErr;
    } else {
      return existing.couple_id;
    }
  } else {
    const { error: insertErr } = await supabase.from("couple_members").insert({
      couple_id: inviterCouple.id,
      user_id: user.id,
    });
    if (insertErr) throw insertErr;
  }

  const { data: tokenRow } = await supabase
    .from("ics_feed_tokens")
    .select("token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tokenRow) {
    const token = randomBytes(24).toString("hex");
    await supabase.from("ics_feed_tokens").insert({ user_id: user.id, token });
  }

  return inviterCouple.id;
}
