import { z } from "zod";

export const voiceEventSchema = z.object({
  title: z.string().min(1),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  needs_confirmation: z.array(z.string()).default([]),
});

export const voiceEventsArraySchema = z.array(voiceEventSchema);

export type VoiceEventParsed = z.infer<typeof voiceEventSchema>;

export type ProposedEvent = VoiceEventParsed & {
  clientId: string;
  place_name?: string | null;
  address?: string | null;
  category?: string | null;
  scope?: "us" | "mine" | "theirs";
};
