import { createServiceClient } from "@/lib/supabase/server";
import {
  buildUserFeed,
  filterEventsForFeed,
} from "@/lib/ics-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "");

  const supabase = await createServiceClient();
  const { data: tokenRow } = await supabase
    .from("ics_feed_tokens")
    .select("user_id")
    .eq("token", token)
    .single();

  if (!tokenRow) {
    return new Response("Not found", { status: 404 });
  }

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", tokenRow.user_id)
    .single();

  if (!membership) {
    return new Response("Not found", { status: 404 });
  }

  const { data: members } = await supabase
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", membership.couple_id);

  const partnerId =
    members?.find((m) => m.user_id !== tokenRow.user_id)?.user_id ?? null;

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("couple_id", membership.couple_id)
    .order("starts_at");

  const filtered = filterEventsForFeed(
    events ?? [],
    tokenRow.user_id,
    partnerId,
  );

  const body = buildUserFeed(filtered, tokenRow.user_id, "Ruffles");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
