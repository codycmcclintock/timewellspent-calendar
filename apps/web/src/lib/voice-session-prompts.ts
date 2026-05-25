export type VoiceParseMode = "first" | "weekly" | "trip";

export function sessionPrompt(mode: VoiceParseMode): string {
  switch (mode) {
    case "first":
      return "Tell me about your week";
    case "trip":
      return "Where are we going and when?";
    case "weekly":
    default:
      return "What's coming up?";
  }
}
