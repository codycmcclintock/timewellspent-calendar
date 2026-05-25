import { addDays, format, parseISO } from "date-fns";
import type { Draft, Plan } from "@/lib/types";

export type SmartPlanStop = {
  draft_id: string;
  title: string;
  day: string;
  starts_at: string;
  ends_at: string;
  place_name: string | null;
  description: string | null;
  sort_order: number;
};

export type SmartPlanGap = {
  title: string;
  day: string;
  starts_at: string;
  ends_at: string;
  description: string;
};

export type SmartPlanResult = {
  stops: SmartPlanStop[];
  gaps: SmartPlanGap[];
};

function planDateWindow(plan: Plan): { start: string; days: number } {
  const days = plan.trip_length_days ?? 3;
  if (plan.starts_on) {
    return { start: plan.starts_on, days };
  }
  if (plan.flexible_month) {
    return { start: `${plan.flexible_month}-15`, days };
  }
  return { start: format(new Date(), "yyyy-MM-dd"), days };
}

export async function buildSmartPlan(
  plan: Plan,
  drafts: Draft[],
): Promise<SmartPlanResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  const { start, days } = planDateWindow(plan);
  const end = format(addDays(parseISO(start), days - 1), "yyyy-MM-dd");

  const draftList = drafts
    .filter((d) => d.source_url)
    .map((d) => ({
      id: d.id,
      title: d.title,
      url: d.source_url,
      place: d.place_name,
      meta: d.raw_metadata,
    }));

  if (!key || draftList.length === 0) {
    return fallbackSmartPlan(start, days, drafts);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: `You are a trip scheduler for couples app Ruffles. Given saved link drafts for ${plan.destination ?? plan.title}, assign each to a day and time window between ${start} and ${end} (${days} days). Order geographically/logically. Add 1-2 gap-filler suggestions for empty half-days. Return JSON only: {"stops":[{"draft_id":"uuid","title":"...","day":"YYYY-MM-DD","starts_at":"ISO","ends_at":"ISO","place_name":null,"description":null,"sort_order":0}],"gaps":[{"title":"...","day":"YYYY-MM-DD","starts_at":"ISO","ends_at":"ISO","description":"..."}]}`,
      messages: [
        {
          role: "user",
          content: JSON.stringify({ plan: plan.title, destination: plan.destination, drafts: draftList }),
        },
      ],
    }),
  });

  if (!res.ok) return fallbackSmartPlan(start, days, drafts);

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) return fallbackSmartPlan(start, days, drafts);

  try {
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    const parsed = JSON.parse(
      startIdx >= 0 ? text.slice(startIdx, endIdx + 1) : text,
    ) as SmartPlanResult;
    if (!parsed.stops?.length) return fallbackSmartPlan(start, days, drafts);
    return parsed;
  } catch {
    return fallbackSmartPlan(start, days, drafts);
  }
}

function fallbackSmartPlan(
  start: string,
  days: number,
  drafts: Draft[],
): SmartPlanResult {
  const stops: SmartPlanStop[] = drafts
    .filter((d) => d.source_url)
    .map((d, i) => {
      const dayOffset = i % days;
      const day = format(addDays(parseISO(start), dayOffset), "yyyy-MM-dd");
      const hour = 9 + (i % 4) * 3;
      const starts = `${day}T${String(hour).padStart(2, "0")}:00:00`;
      const ends = `${day}T${String(hour + 2).padStart(2, "0")}:00:00`;
      return {
        draft_id: d.id,
        title: d.title ?? "Saved spot",
        day,
        starts_at: starts,
        ends_at: ends,
        place_name: d.place_name ?? null,
        description: null,
        sort_order: i,
      };
    });

  return { stops, gaps: [] };
}
