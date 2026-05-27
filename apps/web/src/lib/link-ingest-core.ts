import type { SupabaseClient, User } from "@supabase/supabase-js";
import { detectLinkDestination, detectSourceType } from "@/lib/link-destination";
import { destinationKeyFromLabel } from "@/lib/plan-utils";
import { canSaveReel, isProSubscriber } from "@/lib/pricing";
import { planMatchesDestination } from "@/lib/reel-routing";

export type IngestLinkOptions = {
  title?: string;
  planId?: string;
  destination?: string;
  destinationKey?: string;
  forceInbox?: boolean;
};

async function inboxReelSaveCount(
  supabase: SupabaseClient,
  coupleId: string,
): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("drafts")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", coupleId)
    .is("plan_id", null)
    .not("source_url", "is", null)
    .gte("created_at", start.toISOString());

  return count ?? 0;
}

export async function runDraftMatch(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string,
  draft: { id: string; matched_at?: string | null },
  trimmed: string,
) {
  const { normalizeSourceUrl } = await import("@/lib/normalize-url");
  const normalized = normalizeSourceUrl(trimmed);
  const { data: partnerDrafts } = await supabase
    .from("drafts")
    .select("id, created_by, title, source_url")
    .eq("couple_id", coupleId)
    .neq("created_by", userId)
    .not("source_url", "is", null);

  const match = (partnerDrafts ?? []).find(
    (d) => d.source_url && normalizeSourceUrl(d.source_url) === normalized,
  );
  if (match) {
    const now = new Date().toISOString();
    await supabase
      .from("drafts")
      .update({ matched_at: now, match_partner_draft_id: match.id })
      .eq("id", draft.id);
    await supabase
      .from("drafts")
      .update({ matched_at: now, match_partner_draft_id: draft.id })
      .eq("id", match.id);
  }
}

/** Ingest a reel link with an authenticated Supabase client (web cookies or iOS Bearer). */
export async function ingestLinkCore(
  supabase: SupabaseClient,
  user: User,
  coupleId: string,
  sourceUrl: string,
  options?: IngestLinkOptions,
) {
  const trimmed = sourceUrl.trim();
  if (!trimmed) throw new Error("Paste a link first.");

  const sourceType = detectSourceType(trimmed);
  let destination = options?.destination;
  let destinationKey = options?.destinationKey;
  let confidence: "high" | "medium" | "low" = "high";
  let placeName: string | null = null;
  let rawMetadata: Record<string, unknown> = {};

  if (!destination || !destinationKey) {
    const detected = await detectLinkDestination(trimmed, sourceType);
    destination = detected.destination;
    destinationKey = detected.destination_key;
    confidence = detected.confidence;
    placeName = detected.place_name;
    rawMetadata = { ...detected.raw_metadata };
  }

  const destKey =
    destinationKey ?? destinationKeyFromLabel(destination ?? "Trip ideas");
  const destLabel = destination ?? "Trip ideas";

  if (confidence === "low" && !options?.destination) {
    return {
      needsDestination: true as const,
      sourceUrl: trimmed,
      sourceType,
      forceInbox: options?.forceInbox ?? false,
    };
  }

  let targetPlanId = options?.planId;
  let targetPlanSlug: string | undefined;
  let autoRouted = false;

  if (!targetPlanId && !options?.forceInbox && destination && destKey) {
    const { data: plans } = await supabase
      .from("plans")
      .select("id, slug, destination, destination_key")
      .eq("couple_id", coupleId);

    const match = (plans ?? []).find((p) =>
      planMatchesDestination(p, destKey, destLabel),
    );
    if (match) {
      targetPlanId = match.id;
      targetPlanSlug = match.slug;
      autoRouted = true;
    }
  }

  const saveToInbox = !targetPlanId;

  if (saveToInbox) {
    const { data: couple } = await supabase
      .from("couples")
      .select("is_pro")
      .eq("id", coupleId)
      .single();
    const used = await inboxReelSaveCount(supabase, coupleId);
    if (!canSaveReel(used, isProSubscriber(couple?.is_pro))) {
      const err = new Error("SAVE_LIMIT_REACHED");
      (err as Error & { code: string }).code = "SAVE_LIMIT_REACHED";
      throw err;
    }
  }

  if (targetPlanId && !targetPlanSlug) {
    const { data: plan } = await supabase
      .from("plans")
      .select("slug, destination")
      .eq("id", targetPlanId)
      .eq("couple_id", coupleId)
      .single();
    targetPlanSlug = plan?.slug;
  }

  const meta = rawMetadata as Record<string, unknown>;
  const title =
    options?.title ??
    (typeof meta.title === "string" ? meta.title : null) ??
    placeName ??
    trimmed.slice(0, 80);

  const { data: draft, error } = await supabase
    .from("drafts")
    .insert({
      couple_id: coupleId,
      plan_id: targetPlanId ?? null,
      created_by: user.id,
      source_url: trimmed,
      source_type: sourceType,
      title,
      place_name: placeName,
      status: "draft",
      suggested_day: null,
      sort_order: 0,
      raw_metadata: {
        ...meta,
        destination: destLabel,
        destination_key: destKey,
        parse_status:
          confidence === "low" ? "no_location" : "success",
      },
    })
    .select()
    .single();

  if (error) throw error;

  await runDraftMatch(supabase, coupleId, user.id, draft, trimmed);

  let planTitle: string | undefined;
  if (autoRouted && targetPlanId) {
    const { data: routedPlan } = await supabase
      .from("plans")
      .select("destination, title")
      .eq("id", targetPlanId)
      .single();
    planTitle = routedPlan?.destination ?? routedPlan?.title ?? destLabel;
  }

  return {
    needsDestination: false as const,
    inbox: saveToInbox,
    autoRouted,
    planSlug: targetPlanSlug,
    planId: targetPlanId,
    planTitle: planTitle ?? destLabel,
    draft,
    draftTitle: title,
    matched: !!draft.matched_at,
  };
}
