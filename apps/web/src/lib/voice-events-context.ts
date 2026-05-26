import { formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { DISPLAY_TZ } from "@/lib/dates";
import type { VoiceParseMode } from "@/lib/voice-session-prompts";

export async function buildVoiceParseContext(
  mode: VoiceParseMode,
  planSlug?: string,
) {
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

  let trip_context: string | null = null;
  if (mode === "trip" && planSlug) {
    const { data: plan } = await supabase
      .from("plans")
      .select("id, title, destination, starts_on, ends_on, vibe")
      .eq("couple_id", ctx.coupleId)
      .eq("slug", planSlug)
      .maybeSingle();

    if (plan) {
      const { data: tripEvents } = await supabase
        .from("events")
        .select("title, starts_at, place_name")
        .eq("plan_id", plan.id)
        .order("starts_at")
        .limit(30);

      trip_context = JSON.stringify({
        plan_slug: planSlug,
        title: plan.title,
        destination: plan.destination,
        dates: `${plan.starts_on} – ${plan.ends_on}`,
        vibe: plan.vibe,
        existing_events: tripEvents ?? [],
      });
    } else {
      trip_context = `Trip slug: ${planSlug}`;
    }
  } else if (mode === "trip") {
    trip_context = "Joshua Tree desert weekend (May 2026)";
  }

  return {
    mode,
    current_datetime: formatISO(new Date()),
    user_timezone: DISPLAY_TZ,
    user_name: ctx.profile.display_name ?? "You",
    partner_name: ctx.partner?.display_name ?? null,
    recent_events_json: JSON.stringify(recent ?? [], null, 2),
    trip_context,
    userId: ctx.userId,
    coupleId: ctx.coupleId,
  };
}
