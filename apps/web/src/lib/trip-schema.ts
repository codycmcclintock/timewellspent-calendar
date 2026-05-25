import { z } from "zod";

export const tripEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  place_name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  category: z
    .enum(["meal", "coffee", "activity", "travel", "lodging", "other"])
    .optional()
    .nullable(),
  scope: z.enum(["us", "mine", "theirs"]).default("us"),
  hours_label: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cost_is_free: z.boolean().optional(),
  cost_cents: z.number().int().optional().nullable(),
});

export const tripPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  starts_on: z.string().optional().nullable(),
  ends_on: z.string().optional().nullable(),
  cover_image_url: z.string().url().optional().nullable(),
});

export const tripAiResponseSchema = z.object({
  plan: tripPlanSchema,
  events: z.array(tripEventSchema).min(1),
});

export type TripAiResponse = z.infer<typeof tripAiResponseSchema>;
export type TripEventInput = z.infer<typeof tripEventSchema>;
