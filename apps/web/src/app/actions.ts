"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { parseCalendarFile, defaultCalendarPath } from "@/lib/ics-import";
import { randomBytes } from "crypto";
import type { EventScope } from "@/lib/types";

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
  return couple.id;
}

export async function joinCouple(inviteToken: string) {
  const { supabase, user } = await requireAuth();
  const service = await createServiceClient();

  const { data: couple } = await service
    .from("couples")
    .select("id")
    .eq("invite_token", inviteToken)
    .single();

  if (!couple) throw new Error("Invalid invite");

  const { data: existing } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing.couple_id;

  await supabase.from("couple_members").insert({
    couple_id: couple.id,
    user_id: user.id,
  });

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
  return couple.id;
}

export async function importLegacyCalendar(filePath?: string) {
  const { supabase, user, coupleId } = await requireCouple();
  const path = filePath ?? defaultCalendarPath();
  const parsed = await parseCalendarFile(path);

  let planId: string | null = null;
  const { data: existingPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("slug", "joshua-tree")
    .maybeSingle();

  if (existingPlan) {
    planId = existingPlan.id;
  } else {
    const { data: plan } = await supabase
      .from("plans")
      .insert({
        couple_id: coupleId,
        slug: "joshua-tree",
        title: "Joshua Tree",
        description: "Imported adventure plan",
        cover_image_url:
          "https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=800&q=80",
      })
      .select()
      .single();
    planId = plan?.id ?? null;
  }

  let inserted = 0;
  for (const e of parsed) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("couple_id", coupleId)
      .eq("legacy_uid", e.legacy_uid)
      .maybeSingle();

    if (existing) continue;

    await supabase.from("events").insert({
      couple_id: coupleId,
      plan_id: planId,
      created_by: user.id,
      scope: e.scope,
      title: e.title,
      description: e.description,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      place_name: e.place_name,
      address: e.address,
      legacy_uid: e.legacy_uid,
    });
    inserted++;
  }

  revalidatePath("/home");
  revalidatePath("/plans");
  return { inserted, total: parsed.length };
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
  const { supabase, user, coupleId } = await requireCouple();
  let sourceType: "paste" | "instagram" | "tiktok" = "paste";
  if (sourceUrl.includes("instagram")) sourceType = "instagram";
  if (sourceUrl.includes("tiktok")) sourceType = "tiktok";

  const { data, error } = await supabase
    .from("drafts")
    .insert({
      couple_id: coupleId,
      created_by: user.id,
      source_url: sourceUrl,
      source_type: sourceType,
      title: title ?? sourceUrl.slice(0, 80),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/home");
  return data;
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
