import { tripAiResponseSchema, type TripAiResponse } from "@/lib/trip-schema";

const SYSTEM_PROMPT = `You are a couples trip planner for the Ruffles app.
Turn natural speech or notes into a structured Joshua Tree / adventure itinerary.

Return ONLY valid JSON matching this shape:
{
  "plan": {
    "title": "Joshua Tree",
    "description": "One sentence vibe for the trip",
    "starts_on": "YYYY-MM-DD",
    "ends_on": "YYYY-MM-DD",
    "cover_image_url": "https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=1200&q=80"
  },
  "events": [
    {
      "title": "Short activity name",
      "description": "Warm, personal details (can be multi-line)",
      "starts_at": "ISO 8601 datetime with timezone offset",
      "ends_at": "ISO 8601 datetime",
      "place_name": "Venue or area",
      "address": "Full address if known",
      "category": "meal|coffee|activity|travel|lodging|other",
      "scope": "us",
      "hours_label": "Optional e.g. 2 hr hike",
      "notes": "Packing tips, reservations, etc.",
      "cost_is_free": false,
      "cost_cents": 2500
    }
  ]
}

Rules:
- Use America/Los_Angeles times when the user mentions Joshua Tree or desert trips.
- Infer reasonable durations (30–120 min) if not stated.
- scope is almost always "us".
- Include 8–25 events for a full weekend if the user gives rich detail; fewer if they only mention a couple things.
- Preserve romantic / personal tone from the user's words when possible.`;

export async function parseTripFromNaturalLanguage(
  input: string,
): Promise<TripAiResponse> {
  const trimmed = input.trim();
  if (trimmed.length < 8) {
    throw new Error("Say or type a bit more about your trip (at least a sentence).");
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  let rawJson: string;

  if (openaiKey) {
    rawJson = await callOpenAI(trimmed, openaiKey);
  } else if (anthropicKey) {
    rawJson = await callAnthropic(trimmed, anthropicKey);
  } else {
    throw new Error(
      "Add OPENAI_API_KEY or ANTHROPIC_API_KEY to Vercel / .env.local to use voice planning.",
    );
  }

  const parsed = JSON.parse(extractJson(rawJson)) as unknown;
  return tripAiResponseSchema.parse(parsed);
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

async function callOpenAI(input: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");
  return content;
}

async function callAnthropic(input: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned an empty response.");
  return text;
}
