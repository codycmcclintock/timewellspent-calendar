"use client";

import { useRouter } from "next/navigation";
import { Check, Smartphone, Users, Sparkles } from "lucide-react";
import { FREE_INBOX_REEL_SAVES_PER_MONTH } from "@/lib/pricing";
import { markPlansTeachingSeen, trackEmptyState } from "@/lib/plans-teaching";

const steps = [
  {
    icon: Smartphone,
    title: "Save reels from anywhere",
    body: `Save TikTok and Instagram posts — we route them to the right trip automatically. ${FREE_INBOX_REEL_SAVES_PER_MONTH} free stray saves per month if we can't place them, then Pro.`,
  },
  {
    icon: Users,
    title: "Invite your people",
    body: "When two of you save the same spot, it gets a match.",
  },
  {
    icon: Sparkles,
    title: "AI builds the day",
    body: "Talk it through or tap \"Plan this day.\" Free forever.",
  },
];

export function PlansTeachingSheet({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const router = useRouter();

  if (!open) return null;

  function startTrip() {
    trackEmptyState("empty_state_cta_tapped");
    markPlansTeachingSeen();
    onDismiss();
    router.push("/plans/new");
  }

  function maybeLater() {
    trackEmptyState("empty_state_dismissed");
    markPlansTeachingSeen();
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={maybeLater}
      />
      <div className="relative mx-auto w-full max-w-lg rounded-t-3xl bg-card px-5 pb-8 pt-6 shadow-xl ring-1 ring-black/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h2 className="mt-4 text-center font-serif text-xl font-semibold text-ink">
          Trips, the way you actually plan them
        </h2>
        <p className="mt-1 text-center text-sm text-muted">
          Three taps and you&apos;re going.
        </p>
        <ol className="mt-5 space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  <span className="sr-only">Step {i + 1}. </span>
                  {s.title}
                </p>
                <p className="mt-0.5 text-sm leading-snug text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={startTrip}
          className="mt-6 w-full rounded-full bg-primary-500 py-3.5 text-sm font-semibold text-white"
        >
          Start my first trip
        </button>
        <button
          type="button"
          onClick={maybeLater}
          className="mt-3 w-full py-2 text-sm text-muted"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
