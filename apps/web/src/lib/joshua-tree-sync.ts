import { createServiceClient } from "@/lib/supabase/server";
import {
  parseCalendarFile,
  defaultCalendarPath,
  fallbackCalendarPath,
} from "@/lib/ics-import";
import { inferItemType } from "@/lib/infer-item-type";
import { splitLocation } from "@/lib/split-location";
import { access } from "fs/promises";

export const JT_RANGE_START = "2026-05-15T07:00:00-07:00";
export const JT_RANGE_END = "2026-05-19T06:59:59-07:00";

async function readBundledCalendar() {
  const paths = [defaultCalendarPath(), fallbackCalendarPath()];
  for (const path of paths) {
    try {
      await access(path);
      return parseCalendarFile(path);
    } catch {
      continue;
    }
  }
  throw new Error("calendar.ics not found");
}

/** Core fields always present (migration 001). */
function baseEventPayload(
  e: Awaited<ReturnType<typeof parseCalendarFile>>[number],
  planId: string,
  sortOrder: number,
) {
  const loc = splitLocation(e.place_name ?? e.address);
  return {
    plan_id: planId,
    scope: e.scope,
    title: e.title,
    description: e.description,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    place_name: loc.place_name ?? e.place_name,
    address: loc.address ?? e.address,
    category: e.category,
    hours_label: e.hours_label,
    notes: e.notes,
    bring_items: e.bring_items?.length ? e.bring_items : [],
    sort_order: sortOrder,
  };
}

function extendedEventPayload(
  e: Awaited<ReturnType<typeof parseCalendarFile>>[number],
) {
  return {
    item_type: inferItemType(e.title, e.description),
    source_type: "import",
  };
}

async function safeUpdate(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  id: string,
  coupleId: string,
  payload: Record<string, unknown>,
) {
  const { error } = await service
    .from("events")
    .update(payload)
    .eq("id", id)
    .eq("couple_id", coupleId);
  if (!error) return true;

  const msg = error.message ?? "";
  if (/item_type|source_type|estimated_cost|tags/.test(msg)) {
    const { item_type: _i, source_type: _s, ...rest } = payload as {
      item_type?: string;
      source_type?: string;
    };
    const { error: retry } = await service
      .from("events")
      .update(rest)
      .eq("id", id)
      .eq("couple_id", coupleId);
    return !retry;
  }
  return false;
}

/**
 * Idempotent: import ICS + link all JT-window events to the joshua-tree plan.
 * Uses service role so linking is not blocked by RLS or optional column errors.
 */
export async function syncJoshuaTreeEvents(
  coupleId: string,
  userId: string,
): Promise<{ planId: string; linked: number; inserted: number }> {
  const service = await createServiceClient();
  const parsed = await readBundledCalendar();

  let planId: string;
  const { data: existingPlan } = await service
    .from("plans")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("slug", "joshua-tree")
    .maybeSingle();

  if (existingPlan) {
    planId = existingPlan.id;
    await service
      .from("plans")
      .update({
        title: "Joshua Tree",
        starts_on: "2026-05-15",
        ends_on: "2026-05-18",
        status: "scheduled",
        trip_length_days: 4,
        date_mode: "exact",
      })
      .eq("id", planId);
  } else {
    const { data: plan, error } = await service
      .from("plans")
      .insert({
        couple_id: coupleId,
        slug: "joshua-tree",
        title: "Joshua Tree",
        destination: "Joshua Tree",
        destination_key: "joshua-tree",
        status: "scheduled",
        starts_on: "2026-05-15",
        ends_on: "2026-05-18",
        trip_length_days: 4,
        date_mode: "exact",
        cover_image_url:
          "https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=1200&q=80",
        day_themes: {
          "2026-05-15": { title: "Slow LA night", subtitle: "Relax, fuel up, sleep early." },
          "2026-05-16": { title: "LA → Joshua Tree", subtitle: "Market, art, Transmission sunset." },
          "2026-05-17": { title: "Sunrise horseback → hikes → dinner", subtitle: "The big day." },
          "2026-05-18": { title: "Laguna reset", subtitle: "Ocean, gym, work day." },
        },
      })
      .select("id")
      .single();
    if (error || !plan) throw error ?? new Error("Could not create Joshua Tree plan");
    planId = plan.id;
  }

  let inserted = 0;
  let linked = 0;

  for (const [i, e] of parsed.entries()) {
    if (/SHARED CAL TEST/i.test(e.title)) continue;

    const base = baseEventPayload(e, planId, i);
    const extended = extendedEventPayload(e);

    const { data: existing } = await service
      .from("events")
      .select("id, plan_id")
      .eq("couple_id", coupleId)
      .eq("legacy_uid", e.legacy_uid)
      .maybeSingle();

    if (existing) {
      const needsLink =
        !existing.plan_id || existing.plan_id !== planId;
      const ok = await safeUpdate(service, existing.id, coupleId, {
        ...base,
        ...extended,
      });
      if (ok && needsLink) linked++;
      continue;
    }

    const { error: insertErr } = await service.from("events").insert({
      couple_id: coupleId,
      created_by: userId,
      legacy_uid: e.legacy_uid,
      ...base,
      ...extended,
    });

    if (insertErr && /item_type|source_type/.test(insertErr.message ?? "")) {
      const { error: retry } = await service.from("events").insert({
        couple_id: coupleId,
        created_by: userId,
        legacy_uid: e.legacy_uid,
        ...base,
      });
      if (!retry) inserted++;
    } else if (!insertErr) {
      inserted++;
    }
  }

  const { data: orphans } = await service
    .from("events")
    .select("id")
    .eq("couple_id", coupleId)
    .is("plan_id", null)
    .gte("starts_at", JT_RANGE_START)
    .lte("starts_at", JT_RANGE_END);

  if (orphans?.length) {
    await service
      .from("events")
      .update({ plan_id: planId })
      .eq("couple_id", coupleId)
      .is("plan_id", null)
      .gte("starts_at", JT_RANGE_START)
      .lte("starts_at", JT_RANGE_END);
    linked += orphans.length;
  }

  return { planId, linked, inserted };
}
