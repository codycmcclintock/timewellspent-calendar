import {
  voiceEventsArraySchema,
  type VoiceEventParsed,
} from "@/lib/voice-events-schema";
import type { VoiceParseMode } from "@/lib/voice-session-prompts";

function buildSystemPrompt(ctx: {
  current_datetime: string;
  user_timezone: string;
  user_name: string;
  partner_name: string | null;
  recent_events_json: string;
  trip_context?: string | null;
  mode: VoiceParseMode;
}): string {
  const tripHint =
    ctx.mode === "trip"
      ? `\nThe user is planning a trip — include travel legs as separate events with realistic drive durations.${
          ctx.trip_context ? `\nTrip context: ${ctx.trip_context}` : ""
        }`
      : "";

  return `You are a personal event planner inside a calendar app called Ruffles. The user just recorded a voice memo about their upcoming week or trip. Your job is to extract structured calendar events from their natural speech.

INPUT: A voice transcript that may be rambling, non-linear, and conversational. The user may mention multiple events, change their mind mid-sentence, reference times relative to "today" or "this weekend," and skip details a calendar event would normally require.

CONTEXT YOU HAVE:
- Today's date and time: ${ctx.current_datetime}
- User's timezone: ${ctx.user_timezone}
- User's name: ${ctx.user_name}
- Partner's name (if any): ${ctx.partner_name ?? "none"}
- Recent events on their calendar (last 14 days, for context): ${ctx.recent_events_json}
${tripHint}

OUTPUT: A JSON array of event objects. Nothing else. No prose, no markdown, no commentary.

Each event:
{
  "title": "Short, scannable, sentence case. No emoji unless the user explicitly named one.",
  "starts_at": "ISO 8601 with timezone offset, e.g. 2026-05-25T18:00:00-07:00",
  "ends_at": "ISO 8601 with timezone offset. If user didn't specify, estimate: meals=90min, hikes=2hr, workouts=1hr, drives=use realistic estimate, work shifts=as stated, default=1hr",
  "location": "Specific address if knowable from context, otherwise venue name, otherwise null",
  "description": "Warm, concise, written FROM the user TO their partner. 1-3 sentences. Mix practical info with one tender note. Match how the user actually speaks (don't fabricate intimacy). If partner_name is set and the event involves them, write to them directly.",
  "confidence": "high | medium | low — how sure you are about the time and date",
  "needs_confirmation": ["array of specific fields the user should double-check, e.g. 'time', 'location', 'whether partner will be there'"]
}

EXTRACTION RULES:
1. Be conservative. If the user says "we might go to the beach this weekend," that's confidence: low. If they say "I'm dropping her off at 5 PM Monday," that's confidence: high.
2. Never invent dates. If the user says "next Tuesday" and it's ambiguous (e.g. spoken on a Monday), include needs_confirmation: ["date"].
3. Drive times are events. If the user mentions a destination and an origin, create an event for the drive with realistic duration.
4. Recurring work shifts that follow a clear pattern get one event per day mentioned, not a recurring rule (simpler to edit).
5. Don't pad descriptions with motivational language. Don't add "Have fun!" or "Enjoy!" — write like the user talks.
6. If the user mentions an event but it's clearly a thought, not a plan ("I want to start running more"), skip it. Only extract concrete time-bound items.
7. If the user references a place by shorthand ("the coffee shop", "her work"), use the shorthand in title but flag location: null with needs_confirmation: ["location"].
8. When in doubt about partner involvement, default to including them only if explicitly stated.

VOICE & TONE for descriptions:
- The user is planning shared experiences with their partner. Descriptions should feel like a love note, not a corporate calendar entry.
- Use the partner's name occasionally, not in every event (annoying).
- One Spanish phrase per 3-4 events maximum if the user has used Spanish in past events (check recent_events_json). Don't force it.
- Never write generic filler ("Looking forward to it!" or "This will be fun!"). Either say something specific or say nothing.

EDGE CASES:
- If the transcript is empty, gibberish, or has no extractable events, return [].
- If the user describes the past ("I went to a great place last week"), don't create future events for it.
- If the user asks a question instead of giving plans ("what should we do this weekend?"), return [] — the app will handle this differently.

Return only the JSON array. Start your response with [ and end with ].`;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

async function callAnthropic(system: string, input: string, apiKey: string) {
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
      system,
      messages: [{ role: "user", content: input }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    try {
      const err = JSON.parse(body) as { error?: { message?: string } };
      if (err.error?.message) {
        throw new Error(
          err.error.message.includes("model:")
            ? "AI model unavailable. Redeploy the app or set ANTHROPIC_MODEL in env."
            : err.error.message,
        );
      }
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith("Anthropic")) throw e;
    }
    throw new Error(`Anthropic error: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned an empty response.");
  return text;
}

async function callOpenAI(system: string, input: string, apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");
  return content;
}

export async function parseVoiceEvents(
  transcript: string,
  ctx: Parameters<typeof buildSystemPrompt>[0],
): Promise<VoiceEventParsed[]> {
  const trimmed = transcript.trim();
  if (trimmed.length < 8) {
    throw new Error("Say or type a bit more (at least a sentence).");
  }

  const system = buildSystemPrompt(ctx);
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let raw: string;
  if (anthropicKey) {
    raw = await callAnthropic(system, trimmed, anthropicKey);
  } else if (openaiKey) {
    raw = await callOpenAI(system, trimmed, openaiKey);
  } else {
    throw new Error(
      "Add ANTHROPIC_API_KEY or OPENAI_API_KEY to use voice planning.",
    );
  }

  const parsed = JSON.parse(extractJson(raw)) as unknown;
  return voiceEventsArraySchema.parse(parsed);
}
