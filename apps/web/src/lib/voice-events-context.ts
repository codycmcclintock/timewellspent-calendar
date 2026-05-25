import { formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { DISPLAY_TZ } from "@/lib/dates";
import type { VoiceParseMode } from "@/lib/voice-session-prompts";

export async function buildVoiceParseContext(mode: VoiceParseMode) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: recent } = await supabase
    .from("events")
    .select("title, description, starts_at, place_name, scope")
    .eq("couple_id", ctx.coupleId)
    .gte("starts_at", since.toISOString())
    .order("starts_at", { ascending: false })
    .limit(40);

  return {
    mode,
    current_datetime: formatISO(new Date()),
    user_timezone: DISPLAY_TZ,
    user_name: ctx.profile.display_name ?? "You",
    partner_name: ctx.partner?.display_name ?? null,
    recent_events_json: JSON.stringify(recent ?? [], null, 2),
    userId: ctx.userId,
    coupleId: ctx.coupleId,
  };
}
