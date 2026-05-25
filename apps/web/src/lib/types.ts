export type EventScope = "us" | "mine" | "theirs";

export type EventCategory =
  | "meal"
  | "coffee"
  | "activity"
  | "travel"
  | "lodging"
  | "other";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Couple {
  id: string;
  name: string | null;
  invite_token: string;
  is_pro?: boolean;
}

export type PlanStatus = "building" | "scheduled";
export type PlanDateMode = "flexible_month" | "exact";

export interface PlanDayTheme {
  title: string;
  subtitle: string;
}

export interface Plan {
  id: string;
  couple_id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  starts_on: string | null;
  ends_on: string | null;
  day_themes?: Record<string, PlanDayTheme> | null;
  destination?: string | null;
  destination_key?: string | null;
  status?: PlanStatus;
  trip_length_days?: number | null;
  date_mode?: PlanDateMode;
  flexible_month?: string | null;
}

export interface CalendarEvent {
  id: string;
  couple_id: string;
  plan_id: string | null;
  created_by: string | null;
  scope: EventScope;
  category: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  place_name: string | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  driving_distance_mi: number | null;
  driving_duration_min: number | null;
  cost_cents: number | null;
  cost_is_free: boolean;
  hours_label: string | null;
  notes: string | null;
  bring_items: string[] | null;
  cover_image_url: string | null;
  completed_at: string | null;
  sort_order: number | null;
  legacy_uid: string | null;
  confidence: string | null;
  needs_confirmation: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  couple_id: string;
  plan_id?: string | null;
  created_by: string | null;
  source_url: string | null;
  source_type: string | null;
  title: string | null;
  status: string;
  suggested_day?: string | null;
  sort_order?: number;
  place_name?: string | null;
  raw_metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface UserContext {
  userId: string;
  coupleId: string;
  profile: Profile;
  partner: Profile | null;
  isPro?: boolean;
}

export interface Todo {
  id: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  completed_at: string | null;
}

