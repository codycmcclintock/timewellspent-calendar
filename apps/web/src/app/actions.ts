"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  parseCalendarFile,
  defaultCalendarPath,
  fallbackCalendarPath,
} from "@/lib/ics-import";
import { parseTripFromNaturalLanguage } from "@/lib/trip-ai";
import type { TripAiResponse } from "@/lib/trip-schema";
import { inferEventCategory } from "@/lib/infer-event-category";
import { inferItemType } from "@/lib/infer-item-type";
import { splitLocation } from "@/lib/split-location";
import { buildPlanDaySuggestions, type PlanDaySuggestion } from "@/lib/plan-day-ai";
import { buildVoiceParseContext } from "@/lib/voice-events-context";
import type { VoiceParseMode } from "@/lib/voice-session-prompts";
import { parseVoiceEvents } from "@/lib/voice-events-ai";
import type { ProposedEvent, VoiceEventParsed } from "@/lib/voice-events-schema";
import { randomBytes } from "crypto";
import type { EventScope } from "@/lib/types";

function toProposedEvents(events: VoiceEventParsed[]): ProposedEvent[] {
  return events.map((e, i) => {
    const loc = e.location ?? null;
    const category = inferEventCategory(e.title, e.description);
    return {
      ...e,
      clientId: `proposed-${i}-${e.starts_at}`,
      place_name: loc,
      address: loc,
      category,
      scope: "us" as const,
    };
  });
}

export async function parseVoiceTranscript(
  transcript: string,
  mode: VoiceParseMode,
  planSlug?: string,
) {
  await requireAuth();
  const ctx = await buildVoiceParseContext(mode, planSlug);
  const events = await parseVoiceEvents(transcript, ctx);
  return toProposedEvents(events);
}

export async function resolvePlanIdBySlug(slug: string) {
  const { supabase, coupleId } = await requireCouple();
  const { data } = await supabase
    .from("plans")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

export async function confirmProposedEvents(
  events: ProposedEvent[],
  options?: { planId?: string | null; planSlug?: string },
) {
  const { supabase, user, coupleId } = await requireCouple();

  let planId = options?.planId ?? null;
  if (!planId && options?.planSlug) {
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("couple_id", coupleId)
      .eq("slug", options.planSlug)
      .maybeSingle();
    planId = plan?.id ?? null;
  }

  let inserted = 0;
  for (const [i, e] of events.entries()) {
    const { error } = await supabase.from("events").insert({
      couple_id: coupleId,
      plan_id: planId,
      created_by: user.id,
      scope: e.scope ?? "us",
      title: e.title,
      description: e.description ?? null,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      place_name: e.place_name ?? e.location ?? null,
      address: e.address ?? e.location ?? null,
      category: e.category ?? inferEventCategory(e.title, e.description),
      confidence: e.confidence,
      needs_confirmation: e.needs_confirmation ?? [],
      legacy_uid: `voice-${Date.now()}-${i}`,
      sort_order: i,
    });
    if (!error) inserted++;
  }

  if (inserted > 0 && events.some((e) => (e.scope ?? "us") === "us")) {
    await notifyPartnerEmail(
      supabase,
      coupleId,
      user.id,
      events[0]?.title ?? "New plans",
    );
  }

  revalidatePath("/home");
  revalidatePath("/plans");
  revalidatePath("/profile");
  if (options?.planSlug) {
    revalidatePath(`/plans/${options.planSlug}`);
  }
  return { inserted };
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await ensureProfile(supabase, user);
  return { supabase, user };
}

/** OAuth users may exist in auth.users before public.profiles row exists. */
async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
) {
  const { data: existing } = await supabase
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

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    avatar_url:
      typeof meta.avatar_url === "string" ? meta.avatar_url : null,
  });

  if (profileError) throw profileError;

  const { error: notifError } = await supabase
    .from("notification_preferences")
    .insert({ user_id: user.id, email_on_us_events: true });

  if (notifError && notifError.code !== "23505") throw notifError;
}

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

async function requireCouple() {
  const { supabase, user } = await requireAuth();
  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) throw new Error("No couple");
  return { supabase, user, coupleId: membership.couple_id };
}

export async function createCouple(name?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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
    .insert({ name: name ?? "Our plans", created_by: user.id })
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

  revalidatePath("/");
  try {
    await ensureJoshuaTreeItinerary();
  } catch {
    /* optional seed */
  }
  return couple.id;
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

export async function joinCouple(inviteToken: string) {
  const { supabase, user } = await requireAuth();
  const service = await createServiceClient();

  const { data: inviterCouple } = await service
    .from("couples")
    .select("id")
    .eq("invite_token", inviteToken)
    .single();

  if (!inviterCouple) throw new Error("Invalid invite");

  const inviterCount = await getCoupleMemberCount(service, inviterCouple.id);
  if (inviterCount >= 2) {
    throw new Error("This invite link is full — the calendar already has two people.");
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

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/profile");
  return inviterCouple.id;
}

async function readBundledCalendar() {
  const { access } = await import("fs/promises");
  for (const path of [defaultCalendarPath(), fallbackCalendarPath()]) {
    try {
      await access(path);
      return parseCalendarFile(path);
    } catch {
      continue;
    }
  }
  throw new Error("calendar.ics not found");
}

export async function importLegacyCalendar(filePath?: string) {
  const { user, coupleId } = await requireCouple();
  if (filePath) {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const service = await createServiceClient();
    const parsed = await parseCalendarFile(filePath);
    const { syncJoshuaTreeEvents } = await import("@/lib/joshua-tree-sync");
    const { planId } = await syncJoshuaTreeEvents(coupleId, user.id);
    return { inserted: parsed.length, linked: 0, total: parsed.length, planId };
  }
  const { syncJoshuaTreeEvents } = await import("@/lib/joshua-tree-sync");
  const result = await syncJoshuaTreeEvents(coupleId, user.id);
  revalidatePath("/home");
  revalidatePath("/plans");
  revalidatePath("/plans/joshua-tree");
  return {
    inserted: result.inserted,
    linked: result.linked,
    total: result.inserted + result.linked,
    planId: result.planId,
  };
}

export async function importJoshuaTreeCalendar() {
  return importLegacyCalendar();
}

/** Idempotent: link bundled ICS + orphan events in trip window to joshua-tree plan. */
export async function ensureJoshuaTreeItinerary() {
  const { user, coupleId } = await requireCouple();
  const { syncJoshuaTreeEvents } = await import("@/lib/joshua-tree-sync");
  const result = await syncJoshuaTreeEvents(coupleId, user.id);
  revalidatePath("/plans/joshua-tree");
  revalidatePath("/home");
  revalidatePath("/plans");
  return {
    inserted: result.inserted,
    linked: result.linked,
    total: result.inserted + result.linked,
    planId: result.planId,
  };
}

async function upsertJoshuaTreePlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coupleId: string,
  plan: TripAiResponse["plan"],
) {
  const slug = "joshua-tree";
  const payload = {
    couple_id: coupleId,
    slug,
    title: plan.title,
    description: plan.description ?? null,
    starts_on: plan.starts_on ?? null,
    ends_on: plan.ends_on ?? null,
    cover_image_url:
      plan.cover_image_url ??
      "https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=1200&q=80",
  };

  const { data: existing } = await supabase
    .from("plans")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    await supabase.from("plans").update(payload).eq("id", existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("plans")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function populateTripFromVoice(
  transcript: string,
  replaceExisting = true,
) {
  const { supabase, user, coupleId } = await requireCouple();
  const trip = await parseTripFromNaturalLanguage(transcript);
  const planId = await upsertJoshuaTreePlan(supabase, coupleId, trip.plan);

  if (replaceExisting) {
    await supabase.from("events").delete().eq("plan_id", planId);
  }

  let inserted = 0;
  for (const [i, e] of trip.events.entries()) {
    const legacy_uid = `ai-${planId}-${i}-${e.starts_at}`;
    const { error } = await supabase.from("events").insert({
      couple_id: coupleId,
      plan_id: planId,
      created_by: user.id,
      scope: e.scope ?? "us",
      title: e.title,
      description: e.description ?? null,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      place_name: e.place_name ?? null,
      address: e.address ?? e.place_name ?? null,
      category: e.category ?? "activity",
      hours_label: e.hours_label ?? null,
      notes: e.notes ?? null,
      cost_is_free: e.cost_is_free ?? false,
      cost_cents: e.cost_cents ?? null,
      legacy_uid,
      sort_order: i,
    });
    if (!error) inserted++;
  }

  revalidatePath("/home");
  revalidatePath("/plans");
  revalidatePath("/plans/joshua-tree");
  return { inserted, total: trip.events.length, planId };
}

export type EventInput = {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  scope: EventScope;
  plan_id?: string;
  place_name?: string;
  address?: string;
  driving_distance_mi?: number;
  driving_duration_min?: number;
  cost_cents?: number;
  cost_is_free?: boolean;
  hours_label?: string;
  notes?: string;
  category?: string;
};

export async function createEvent(input: EventInput) {
  const { supabase, user, coupleId } = await requireCouple();

  const { data, error } = await supabase
    .from("events")
    .insert({
      couple_id: coupleId,
      created_by: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.scope === "us") {
    await notifyPartnerEmail(supabase, coupleId, user.id, input.title);
  }

  revalidatePath("/home");
  revalidatePath("/plans");
  return data;
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput> & { completed_at?: string | null },
) {
  const { supabase, user, coupleId } = await requireCouple();

  const { data, error } = await supabase
    .from("events")
    .update(input)
    .eq("id", id)
    .eq("couple_id", coupleId)
    .select()
    .single();

  if (error) throw error;

  if (input.scope === "us" || data?.scope === "us") {
    await notifyPartnerEmail(
      supabase,
      coupleId,
      user.id,
      data?.title ?? "Plan updated",
    );
  }

  revalidatePath("/home");
  return data;
}

export async function deleteEvent(id: string) {
  const { supabase, coupleId } = await requireCouple();
  await supabase.from("events").delete().eq("id", id).eq("couple_id", coupleId);
  revalidatePath("/home");
}

export async function createDraft(sourceUrl: string, title?: string) {
  return ingestLink(sourceUrl, title ? { title } : undefined);
}

export type CreatePlanInput = {
  destination: string;
  destinationKey: string;
  dateMode: "flexible_month" | "exact";
  flexibleMonth?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  tripLengthDays?: number;
  title?: string;
};

export async function createPlan(input: CreatePlanInput) {
  const { supabase, coupleId } = await requireCouple();
  const { uniquePlanSlug } = await import("@/lib/plan-utils");

  const slug = uniquePlanSlug(input.destinationKey);
  // destination_key is unique per couple in DB — use slug so repeat trips to the same city work
  const destinationKey = slug;

  const { data, error } = await supabase
    .from("plans")
    .insert({
      couple_id: coupleId,
      slug,
      title: input.title ?? input.destination,
      destination: input.destination,
      destination_key: destinationKey,
      status: "building",
      date_mode: input.dateMode,
      flexible_month: input.flexibleMonth ?? null,
      starts_on: input.startsOn ?? null,
      ends_on: input.endsOn ?? null,
      trip_length_days: input.tripLengthDays ?? 3,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/plans");
  return data;
}

export type UpdatePlanSettingsInput = {
  planId: string;
  tripLengthDays?: number;
  dateMode?: "flexible_month" | "exact";
  flexibleMonth?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
};

export async function updatePlanSettings(input: UpdatePlanSettingsInput) {
  const { supabase, coupleId } = await requireCouple();
  const { error } = await supabase
    .from("plans")
    .update({
      trip_length_days: input.tripLengthDays,
      date_mode: input.dateMode,
      flexible_month: input.flexibleMonth,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
    })
    .eq("id", input.planId)
    .eq("couple_id", coupleId);

  if (error) throw error;

  const { data: plan } = await supabase
    .from("plans")
    .select("slug")
    .eq("id", input.planId)
    .single();

  revalidatePath("/plans");
  if (plan?.slug) revalidatePath(`/plans/${plan.slug}`);
}

async function findOrCreatePlanForDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coupleId: string,
  destination: string,
  destinationKey: string,
) {
  const { data: existing } = await supabase
    .from("plans")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("destination_key", destinationKey)
    .neq("slug", "joshua-tree")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { uniquePlanSlug } = await import("@/lib/plan-utils");
  const slug = uniquePlanSlug(destinationKey);

  const { data: created, error } = await supabase
    .from("plans")
    .insert({
      couple_id: coupleId,
      slug,
      title: destination,
      destination,
      destination_key: destinationKey,
      status: "building",
      trip_length_days: 3,
      date_mode: "flexible_month",
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function getInboxReelSaveCount() {
  const { supabase, coupleId } = await requireCouple();
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

export async function ingestLink(
  sourceUrl: string,
  options?: {
    title?: string;
    planId?: string;
    destination?: string;
    destinationKey?: string;
    /** MVP: save to profile inbox (counts toward free reel limit). */
    inbox?: boolean;
  },
) {
  const { supabase, user, coupleId } = await requireCouple();
  const { detectLinkDestination, detectSourceType } = await import(
    "@/lib/link-destination"
  );
  const { destinationKeyFromLabel } = await import("@/lib/plan-utils");
  const { canSaveReel, isProSubscriber } = await import("@/lib/pricing");

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

  const saveToInbox = !options?.planId;

  if (confidence === "low" && !options?.destination) {
    return {
      needsDestination: true as const,
      sourceUrl: trimmed,
      sourceType,
      inbox: saveToInbox,
    };
  }

  if (saveToInbox && !options?.planId) {
    const { data: couple } = await supabase
      .from("couples")
      .select("is_pro")
      .eq("id", coupleId)
      .single();
    const used = await getInboxReelSaveCount();
    if (!canSaveReel(used, isProSubscriber(couple?.is_pro))) {
      const err = new Error("SAVE_LIMIT_REACHED");
      (err as Error & { code: string }).code = "SAVE_LIMIT_REACHED";
      throw err;
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
        plan_id: null,
        created_by: user.id,
        source_url: trimmed,
        source_type: sourceType,
        title,
        place_name: placeName,
        status: "draft",
        raw_metadata: {
          ...meta,
          destination: destination ?? "Trip ideas",
          destination_key:
            destinationKey ?? destinationKeyFromLabel(destination ?? "Trip ideas"),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await runDraftMatch(supabase, coupleId, user.id, draft, trimmed);

    revalidatePath("/profile");
    revalidatePath("/plans");
    revalidatePath("/home");

    return {
      needsDestination: false as const,
      inbox: true as const,
      draft,
      planSlug: undefined,
      planId: undefined,
      matched: !!draft.matched_at,
    };
  }

  let planId = options?.planId;
  let planSlug: string | undefined;

  if (planId) {
    const { data: plan } = await supabase
      .from("plans")
      .select("slug")
      .eq("id", planId)
      .eq("couple_id", coupleId)
      .single();
    planSlug = plan?.slug;
  } else {
    const plan = await findOrCreatePlanForDestination(
      supabase,
      coupleId,
      destination!,
      destinationKey ?? destinationKeyFromLabel(destination!),
    );
    planId = plan.id;
    planSlug = plan.slug;
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
      plan_id: planId,
      created_by: user.id,
      source_url: trimmed,
      source_type: sourceType,
      title,
      place_name: placeName,
      status: "draft",
      suggested_day: null,
      sort_order: 0,
      raw_metadata: rawMetadata,
    })
    .select()
    .single();

  if (error) throw error;

  await runDraftMatch(supabase, coupleId, user.id, draft, trimmed);

  revalidatePath("/home");
  revalidatePath("/plans");
  revalidatePath("/profile");
  if (planSlug) revalidatePath(`/plans/${planSlug}`);

  return {
    needsDestination: false as const,
    inbox: false as const,
    planSlug,
    planId,
    draft,
    matched: !!draft.matched_at,
  };
}

async function runDraftMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function getMatchedDrafts() {
  const { supabase, coupleId, user } = await requireCouple();
  const { data: drafts } = await supabase
    .from("drafts")
    .select("*")
    .eq("couple_id", coupleId)
    .not("matched_at", "is", null)
    .eq("created_by", user.id)
    .order("matched_at", { ascending: false })
    .limit(10);

  if (!drafts?.length) return [];

  const partnerIds = drafts
    .map((d) => d.match_partner_draft_id)
    .filter(Boolean) as string[];
  const { data: partnerDrafts } = await supabase
    .from("drafts")
    .select("id, title, created_by")
    .in("id", partnerIds);

  const { data: members } = await supabase
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId);

  const partnerUserId = members?.find((m) => m.user_id !== user.id)?.user_id;
  let partnerName: string | null = null;
  if (partnerUserId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", partnerUserId)
      .single();
    partnerName = prof?.display_name ?? null;
  }

  return drafts.map((d) => ({
    draft: d,
    partnerTitle:
      partnerDrafts?.find((p) => p.id === d.match_partner_draft_id)?.title ??
      partnerName,
  }));
}

export async function smartPlan(planId: string) {
  const { supabase, user, coupleId } = await requireCouple();

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("couple_id", coupleId)
    .single();

  if (!plan) throw new Error("Plan not found");

  const { data: drafts } = await supabase
    .from("drafts")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at");

  const { buildSmartPlan } = await import("@/lib/smart-plan-ai");
  const result = await buildSmartPlan(plan, drafts ?? []);

  for (const stop of result.stops) {
    await supabase
      .from("drafts")
      .update({
        suggested_day: stop.day,
        sort_order: stop.sort_order,
        status: "scheduled",
      })
      .eq("id", stop.draft_id);

    await supabase.from("events").insert({
      couple_id: coupleId,
      plan_id: planId,
      created_by: user.id,
      scope: "us",
      title: stop.title,
      description: stop.description,
      starts_at: stop.starts_at,
      ends_at: stop.ends_at,
      place_name: stop.place_name,
      category: "activity",
      legacy_uid: `smart-${stop.draft_id}`,
      sort_order: stop.sort_order,
    });
  }

  for (const [i, gap] of result.gaps.entries()) {
    await supabase.from("events").insert({
      couple_id: coupleId,
      plan_id: planId,
      created_by: user.id,
      scope: "us",
      title: gap.title,
      description: gap.description,
      starts_at: gap.starts_at,
      ends_at: gap.ends_at,
      category: "activity",
      legacy_uid: `smart-gap-${planId}-${i}`,
      sort_order: 100 + i,
    });
  }

  await supabase
    .from("plans")
    .update({ status: "scheduled" })
    .eq("id", planId);

  revalidatePath("/plans");
  revalidatePath(`/plans/${plan.slug}`);
  revalidatePath("/home");

  return { stops: result.stops.length, gaps: result.gaps.length };
}

export async function createTodo(title: string) {
  const { supabase, user, coupleId } = await requireCouple();
  const { data, error } = await supabase
    .from("todos")
    .insert({ couple_id: coupleId, created_by: user.id, title })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/profile");
  return data;
}

export async function toggleTodo(id: string, completed: boolean) {
  const { supabase, coupleId } = await requireCouple();
  await supabase
    .from("todos")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("couple_id", coupleId);
  revalidatePath("/profile");
}

export async function rotateIcsToken() {
  const { supabase, user } = await requireAuth();
  const token = randomBytes(24).toString("hex");
  await supabase
    .from("ics_feed_tokens")
    .upsert({ user_id: user.id, token, rotated_at: new Date().toISOString() });
  revalidatePath("/profile");
  return token;
}

async function notifyPartnerEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coupleId: string,
  actorId: string,
  eventTitle: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { data: members } = await supabase
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId);

  const partnerId = members?.find((m) => m.user_id !== actorId)?.user_id;
  if (!partnerId) return;

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_on_us_events")
    .eq("user_id", partnerId)
    .single();

  if (prefs && !prefs.email_on_us_events) return;

  let email: string | undefined;
  try {
    const service = await createServiceClient();
    const { data: authUser } = await service.auth.admin.getUserById(partnerId);
    email = authUser?.user?.email;
  } catch {
    return;
  }
  if (!email) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "Ruffles <onboarding@resend.dev>",
      to: email,
      subject: `Plan updated: ${eventTitle}`,
      html: `<p>Your shared plan was updated: <strong>${eventTitle}</strong></p><p>Open Ruffles or check your subscribed calendar.</p>`,
    }),
  });
}

export async function getCouplePlanCount() {
  const { supabase, coupleId } = await requireCouple();
  const { count } = await supabase
    .from("plans")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", coupleId);
  return count ?? 0;
}

export async function updateEventSortOrder(
  eventId: string,
  sortOrder: number,
) {
  const { supabase, coupleId } = await requireCouple();
  await supabase
    .from("events")
    .update({ sort_order: sortOrder })
    .eq("id", eventId)
    .eq("couple_id", coupleId);
  revalidatePath("/plans", "layout");
}

export async function reorderDayEvents(
  planSlug: string,
  dayKey: string,
  orderedEventIds: string[],
) {
  const { supabase, coupleId } = await requireCouple();
  for (let i = 0; i < orderedEventIds.length; i++) {
    await supabase
      .from("events")
      .update({ sort_order: i })
      .eq("id", orderedEventIds[i])
      .eq("couple_id", coupleId);
  }
  revalidatePath(`/plans/${planSlug}`);
}

export async function deletePlanEvent(eventId: string, planSlug: string) {
  const { supabase, coupleId } = await requireCouple();
  await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("couple_id", coupleId);
  revalidatePath(`/plans/${planSlug}`);
}

export async function duplicatePlanEvent(eventId: string, planSlug: string) {
  const { supabase, user, coupleId } = await requireCouple();
  const { data: row } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("couple_id", coupleId)
    .single();
  if (!row) throw new Error("Event not found");
  const { id: _id, legacy_uid: _uid, created_at: _c, updated_at: _u, ...rest } =
    row;
  await supabase.from("events").insert({
    ...rest,
    created_by: user.id,
    legacy_uid: null,
    sort_order: (row.sort_order ?? 0) + 1,
  });
  revalidatePath(`/plans/${planSlug}`);
}

export async function updatePlanDayTheme(
  planId: string,
  dayKey: string,
  title: string,
  subtitle: string,
) {
  const { supabase, coupleId } = await requireCouple();
  const { data: plan } = await supabase
    .from("plans")
    .select("slug, day_themes")
    .eq("id", planId)
    .eq("couple_id", coupleId)
    .single();
  if (!plan) throw new Error("Plan not found");
  const themes = {
    ...((plan.day_themes as Record<string, { title: string; subtitle: string }>) ??
      {}),
    [dayKey]: { title, subtitle },
  };
  await supabase
    .from("plans")
    .update({ day_themes: themes })
    .eq("id", planId);
  revalidatePath(`/plans/${plan.slug}`);
}

export async function planThisDay(planId: string, dayKey: string) {
  const { supabase, coupleId } = await requireCouple();
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("couple_id", coupleId)
    .single();
  if (!plan) throw new Error("Plan not found");

  const { data: allEvents } = await supabase
    .from("events")
    .select("*")
    .eq("plan_id", planId)
    .order("starts_at");

  const events = allEvents ?? [];
  const dayEvents = events.filter((e) => e.starts_at.startsWith(dayKey));
  const adjacent: Record<string, typeof events> = {};
  for (const e of events) {
    const d = e.starts_at.slice(0, 10);
    if (d !== dayKey) {
      if (!adjacent[d]) adjacent[d] = [];
      adjacent[d].push(e);
    }
  }

  return buildPlanDaySuggestions(
    plan as import("@/lib/types").Plan,
    dayKey,
    dayEvents as import("@/lib/types").CalendarEvent[],
    adjacent as Record<string, import("@/lib/types").CalendarEvent[]>,
  );
}

export async function confirmPlanDaySuggestions(
  planId: string,
  dayKey: string,
  suggestions: PlanDaySuggestion[],
) {
  const { supabase, user, coupleId } = await requireCouple();
  const { data: plan } = await supabase
    .from("plans")
    .select("slug")
    .eq("id", planId)
    .single();

  let order =
    (
      await supabase
        .from("events")
        .select("sort_order")
        .eq("plan_id", planId)
        .order("sort_order", { ascending: false })
        .limit(1)
    ).data?.[0]?.sort_order ?? 0;

  for (const s of suggestions) {
    order += 1;
    const category =
      s.type === "drive" || s.type === "transit"
        ? "travel"
        : inferEventCategory(s.title, s.description);
    await supabase.from("events").insert({
      couple_id: coupleId,
      plan_id: planId,
      created_by: user.id,
      scope: "us",
      title: s.title,
      description: s.description,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      place_name: s.location_name,
      address: s.location_address,
      category,
      item_type: s.type,
      estimated_cost: s.estimated_cost,
      tags: s.tags?.length ? s.tags : [],
      source_type: "ai_suggested",
      sort_order: order,
      confidence: s.confidence,
    });
  }

  if (plan?.slug) revalidatePath(`/plans/${plan.slug}?day=${dayKey}`);
  return suggestions.length;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
