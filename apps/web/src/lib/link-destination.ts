import { destinationKeyFromLabel } from "@/lib/plan-utils";
import { FEATURED_DESTINATIONS } from "@/lib/featured-destinations";

export type LinkDestinationResult = {
  destination: string;
  destination_key: string;
  confidence: "high" | "medium" | "low";
  place_name: string | null;
  raw_metadata: Record<string, unknown>;
};

const URL_CITY_PATTERNS: { pattern: RegExp; destination: string }[] = [
  { pattern: /\bnyc\b|new-york|newyork/i, destination: "New York City" },
  { pattern: /\bla\b|los-angeles|losangeles/i, destination: "Los Angeles" },
  { pattern: /joshua-?tree/i, destination: "Joshua Tree" },
  { pattern: /\bparis\b/i, destination: "Paris" },
  { pattern: /\blondon\b/i, destination: "London" },
  { pattern: /mexico-?city/i, destination: "Mexico City" },
  { pattern: /\bmiami\b/i, destination: "Miami" },
  { pattern: /san-?francisco|sf-bay/i, destination: "San Francisco" },
  { pattern: /\btokyo\b/i, destination: "Tokyo" },
  { pattern: /\blisbon\b/i, destination: "Lisbon" },
];

function matchUrlHeuristics(url: string): LinkDestinationResult | null {
  for (const { pattern, destination } of URL_CITY_PATTERNS) {
    if (pattern.test(url)) {
      return {
        destination,
        destination_key: destinationKeyFromLabel(destination),
        confidence: "medium",
        place_name: null,
        raw_metadata: { detected_via: "url_heuristic" },
      };
    }
  }
  return null;
}

async function matchWithAnthropic(
  url: string,
  sourceType: string,
): Promise<LinkDestinationResult | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const featured = FEATURED_DESTINATIONS.map((d) => d.label).join(", ");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You detect travel destination cities from social links. Reply with JSON only: {"destination":"City Name","place_name":"venue or null","confidence":"high|medium|low","title":"short label for the link"}. Use US city names when obvious. Known cities: ${featured}. If unknown, use best guess from URL path or return confidence low.`,
      messages: [
        {
          role: "user",
          content: `Source: ${sourceType}\nURL: ${url}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) return null;

  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(
      start >= 0 ? text.slice(start, end + 1) : text,
    ) as {
      destination?: string;
      place_name?: string | null;
      confidence?: string;
      title?: string;
    };
    if (!parsed.destination) return null;
    return {
      destination: parsed.destination,
      destination_key: destinationKeyFromLabel(parsed.destination),
      confidence:
        parsed.confidence === "high" || parsed.confidence === "medium"
          ? parsed.confidence
          : "low",
      place_name: parsed.place_name ?? null,
      raw_metadata: {
        detected_via: "anthropic",
        title: parsed.title ?? null,
      },
    };
  } catch {
    return null;
  }
}

export async function detectLinkDestination(
  url: string,
  sourceType: "paste" | "instagram" | "tiktok",
): Promise<LinkDestinationResult> {
  const heuristic = matchUrlHeuristics(url);
  if (heuristic && heuristic.confidence !== "low") {
    return { ...heuristic, raw_metadata: { ...heuristic.raw_metadata, url } };
  }

  const ai = await matchWithAnthropic(url, sourceType);
  if (ai) {
    return { ...ai, raw_metadata: { ...ai.raw_metadata, url } };
  }

  if (heuristic) {
    return { ...heuristic, raw_metadata: { ...heuristic.raw_metadata, url } };
  }

  return {
    destination: "Trip ideas",
    destination_key: "trip-ideas",
    confidence: "low",
    place_name: null,
    raw_metadata: { url, detected_via: "fallback" },
  };
}

export function detectSourceType(url: string): "paste" | "instagram" | "tiktok" {
  if (url.includes("instagram") || url.includes("instagr")) return "instagram";
  if (url.includes("tiktok")) return "tiktok";
  return "paste";
}
