"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { FEATURED_DESTINATIONS } from "@/lib/featured-destinations";
import { destinationKeyFromLabel } from "@/lib/plan-utils";

export function PlanWherePicker({
  onSelect,
}: {
  onSelect: (d: { label: string; key: string }) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = FEATURED_DESTINATIONS.filter((d) =>
    d.label.toLowerCase().includes(query.toLowerCase()),
  );

  const custom =
    query.trim().length >= 2 &&
    !filtered.some((f) => f.label.toLowerCase() === query.trim().toLowerCase());

  return (
    <div>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded-xl border border-black/10 py-3 pl-10 pr-4 text-sm"
          placeholder="Where do you want to go?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Featured destinations
      </p>
      <ul className="mt-2 divide-y divide-black/5 rounded-2xl bg-card ring-1 ring-black/5">
        {filtered.map((d) => (
          <li key={d.key}>
            <button
              type="button"
              onClick={() => onSelect({ label: d.label, key: d.key })}
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-shell"
            >
              {d.image ? (
                <img
                  src={d.image}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-planner" />
              )}
              <span className="flex-1 font-medium text-ink">{d.label}</span>
              <Plus className="h-4 w-4 text-coral" />
            </button>
          </li>
        ))}
        {custom ? (
          <li>
            <button
              type="button"
              onClick={() =>
                onSelect({
                  label: query.trim(),
                  key: destinationKeyFromLabel(query.trim()),
                })
              }
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-shell"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-coral/10">
                <MapPin className="h-5 w-5 text-coral" />
              </div>
              <span className="flex-1 font-medium text-ink">
                Use &quot;{query.trim()}&quot;
              </span>
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
