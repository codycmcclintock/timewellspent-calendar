import { createClient } from "@/lib/supabase/server";
import type { Profile, UserContext } from "@/lib/types";
import { randomBytes } from "crypto";

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: members } = await supabase
    .from("couple_members")
    .select("user_id, profiles(id, display_name, avatar_url)")
    .eq("couple_id", membership.couple_id);

  const partnerRow = members?.find((m) => m.user_id !== user.id);
  const partner = partnerRow?.profiles as Profile | null | undefined;

  return {
    userId: user.id,
    coupleId: membership.couple_id,
    profile: profile as Profile,
    partner: partner ?? null,
  };
}

export async function ensureIcsToken(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ics_feed_tokens")
    .select("token")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.token) return existing.token;

  const token = randomBytes(24).toString("hex");
  await supabase.from("ics_feed_tokens").insert({ user_id: userId, token });
  return token;
}
