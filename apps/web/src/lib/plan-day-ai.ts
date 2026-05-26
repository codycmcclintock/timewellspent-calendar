import { addDays, format, parseISO } from "date-fns";
import type { CalendarEvent, Plan } from "@/lib/types";

export type PlanDaySuggestion = {
  type: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location_name: string | null;
  location_address: string | null;
  description: string;
  estimated_cost: string | null;
  tags: string[];
  confidence: string;
};

export async function buildPlanDaySuggestions(
  plan: Plan,
  dayKey: string,
  existingItems: CalendarEvent[],
  adjacentDays: Record<string, CalendarEvent[]>,
): Promise<PlanDaySuggestion[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  const themes = (plan.day_themes ?? {}) as Record<
    string,
    { title: string; subtitle: string }
  >;
  const theme = themes[dayKey];

  if (!key) {
    return fallbackPlanDay(plan, dayKey, existingItems);
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
      max_tokens: 4096,
      system: `You are an event planner inside Ruffles, a calendar app for couples planning experiences together.
Return only a JSON array of 4-7 itinerary items for the given day. Each item:
{"type":"meal|stay|activity|coffee|hike|shop|transit|moment","title":"...","starts_at":"ISO 8601","ends_at":"ISO 8601","location_name":null,"location_address":null,"description":"warm 1-3 sentences","estimated_cost":"free|$|$$|$$$","tags":[],"confidence":"high|medium|low"}
Include transit/drive items between distant stops. Respect existing items. Match trip vibe.`,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            destination: plan.destination ?? plan.title,
            date: dayKey,
            trip_dates: `${plan.starts_on} to ${plan.ends_on}`,
            day_theme: theme,
            vibe: plan.vibe ?? "romantic adventure",
            existing_items: existingItems.map((e) => ({
              title: e.title,
              starts_at: e.starts_at,
              ends_at: e.ends_at,
            })),
            adjacent_days: Object.fromEntries(
              Object.entries(adjacentDays).map(([d, evs]) => [
                d,
                evs.map((e) => e.title),
              ]),
            ),
          }),
        },
      ],
    }),
  });

  if (!res.ok) return fallbackPlanDay(plan, dayKey, existingItems);

  const data = (await res.json()) as { content?: { text?: string }[] };
  const text = data.content?.[0]?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return fallbackPlanDay(plan, dayKey, existingItems);

  try {
    return JSON.parse(jsonMatch[0]) as PlanDaySuggestion[];
  } catch {
    return fallbackPlanDay(plan, dayKey, existingItems);
  }
}

function fallbackPlanDay(
  plan: Plan,
  dayKey: string,
  existing: CalendarEvent[],
): PlanDaySuggestion[] {
  if (existing.length > 0) return [];
  const dest = plan.destination ?? "your destination";
  const start = parseISO(`${dayKey}T09:00:00-07:00`);
  const endCoffee = parseISO(`${dayKey}T10:30:00-07:00`);
  const startExplore = parseISO(`${dayKey}T11:00:00-07:00`);
  const endExplore = parseISO(`${dayKey}T14:00:00-07:00`);
  return [
    {
      type: "coffee",
      title: "Slow morning coffee",
      starts_at: start.toISOString(),
      ends_at: endCoffee.toISOString(),
      location_name: "Local cafe",
      location_address: null,
      description: `Ease into ${dest} together — no rush.`,
      estimated_cost: "$",
      tags: ["romantic"],
      confidence: "medium",
    },
    {
      type: "activity",
      title: "Explore the neighborhood",
      starts_at: startExplore.toISOString(),
      ends_at: endExplore.toISOString(),
      location_name: null,
      location_address: null,
      description:
        "Wander, photos, and one thing you've both been curious about.",
      estimated_cost: "free",
      tags: ["outdoors"],
      confidence: "low",
    },
  ];
}
