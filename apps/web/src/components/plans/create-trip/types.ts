import type { WhenSelection } from "@/components/plans/PlanWhenPicker";

export type WhereSelection = { label: string; key: string };

export type CreateTripDraft = {
  where: WhereSelection | null;
  when: WhenSelection;
};

export const defaultWhenSelection = (): WhenSelection => ({
  dateMode: "flexible_month",
  tripLengthDays: 3,
});
