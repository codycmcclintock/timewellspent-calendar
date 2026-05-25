"use client";

import { useState } from "react";
import { X, Link2, MapPin, List, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Link2,
    title: "Send a reel",
    body: "Paste or share an Instagram or TikTok link to Ruffles.",
  },
  {
    icon: MapPin,
    title: "We find the city",
    body: "A NYC video creates or opens your New York City plan automatically.",
  },
  {
    icon: List,
    title: "Build your list",
    body: "Everything lands in an unsorted list while you collect ideas.",
  },
  {
    icon: Sparkles,
    title: "Smart Plan (pro)",
    body: "One tap to map the best order, times, and gap fillers.",
  },
];

export function HowItWorksPlans({ variant = "button" }: { variant?: "button" | "inline" }) {
  const [open, setOpen] = useState(false);

  if (variant === "inline") {
    return (
      <section className="rounded-2xl bg-planner p-4 ring-1 ring-coral/15">
        <p className="font-semibold text-ink">How it works</p>
        <ol className="mt-3 space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral/15 text-xs font-bold text-coral">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{s.title}</p>
                <p className="text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-coral underline-offset-2 hover:underline"
      >
        How it works
      </button>
      {open ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">How Ruffles plans work</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-shell"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
