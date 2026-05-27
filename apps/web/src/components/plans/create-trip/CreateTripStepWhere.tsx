"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation, Search } from "lucide-react";
import { FEATURED_DESTINATIONS } from "@/lib/featured-destinations";
import { destinationKeyFromLabel } from "@/lib/plan-utils";
import type { WhereSelection } from "@/components/plans/create-trip/types";

export function CreateTripStepWhere({
  value,
  onChange,
}: {
  value: WhereSelection | null;
  onChange: (w: WhereSelection) => void;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [showGeo, setShowGeo] = useState(true);
  const [geoHint, setGeoHint] = useState<string | null>(null);

  useEffect(() => {
    if (value?.label) setQuery(value.label);
  }, [value?.label]);

  const filtered = useMemo(
    () =>
      FEATURED_DESTINATIONS.filter((d) =>
        d.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  const popular = FEATURED_DESTINATIONS.slice(0, 6);
  const curated = useMemo(() => {
    const rest = FEATURED_DESTINATIONS.slice(2, 6);
    return rest.length ? rest : FEATURED_DESTINATIONS.slice(0, 4);
  }, []);

  const custom =
    query.trim().length >= 2 &&
    !FEATURED_DESTINATIONS.some(
      (f) => f.label.toLowerCase() === query.trim().toLowerCase(),
    );

  function select(d: { label: string; key: string }) {
    setQuery(d.label);
    onChange(d);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setShowGeo(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoHint("Looks like you're near LA — try Joshua Tree or Tulum below.");
        select({ label: "Joshua Tree", key: "joshua-tree" });
      },
      () => setShowGeo(false),
      { timeout: 8000 },
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Step 1 of 3
      </p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
        Where&apos;s the next one?
      </h2>
      <p className="mt-1 text-sm text-muted">
        A city, region, or vibe — type anything. We&apos;ll work with it.
      </p>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="w-full rounded-xl border border-black/10 bg-card py-3 pl-10 pr-4 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="Joshua Tree, Tulum, Big Sur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {custom ? (
        <button
          type="button"
          onClick={() =>
            select({
              label: query.trim(),
              key: destinationKeyFromLabel(query.trim()),
            })
          }
          className="mt-2 w-full rounded-xl bg-primary-50 px-4 py-3 text-left text-sm font-medium text-primary-600 ring-1 ring-primary-500/20"
        >
          Use &ldquo;{query.trim()}&rdquo;
        </button>
      ) : null}

      {filtered.length > 0 && query.trim().length >= 2 ? (
        <ul className="mt-2 max-h-36 overflow-y-auto rounded-xl bg-card ring-1 ring-black/5">
          {filtered.map((d) => (
            <li key={d.key}>
              <button
                type="button"
                onClick={() => select({ label: d.label, key: d.key })}
                className="flex w-full px-4 py-2.5 text-left text-sm hover:bg-shell"
              >
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= 2 && !custom ? (
        <p className="mt-2 text-sm text-muted">
          Hmm, we don&apos;t have that one yet. Try a nearby city or tap a card
          below.
        </p>
      ) : null}

      {showGeo ? (
        <button
          type="button"
          onClick={useCurrentLocation}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-card py-2.5 text-sm font-medium text-ink"
        >
          <Navigation className="h-4 w-4 text-primary-500" />
          Use my current location
        </button>
      ) : null}
      {geoHint ? <p className="mt-2 text-xs text-muted">{geoHint}</p> : null}

      <DestinationRow label="Popular right now" items={popular} selected={value} onSelect={select} />
      <DestinationRow label="Curated for you" items={curated} selected={value} onSelect={select} />

      <p className="mt-8 rounded-xl bg-shell px-4 py-3 text-center text-xs text-muted">
        Not sure yet? Pick anywhere — you can change it later.
      </p>
    </div>
  );
}

function DestinationRow({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: typeof FEATURED_DESTINATIONS;
  selected: WhereSelection | null;
  onSelect: (d: { label: string; key: string }) => void;
}) {
  return (
    <div className="mt-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="-mx-4 mt-2 flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((d) => {
          const active = selected?.key === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelect({ label: d.label, key: d.key })}
              className={`w-[130px] shrink-0 overflow-hidden rounded-xl text-left transition ${
                active
                  ? "ring-2 ring-primary-500"
                  : "ring-1 ring-black/10"
              }`}
            >
              <div
                className="h-[90px] bg-gradient-to-br from-primary-600/40 to-primary-300/25"
                style={
                  d.image
                    ? {
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.35), transparent), url(${d.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <p
                className={`px-2 py-2 text-xs font-semibold ${
                  active ? "bg-primary-50 text-primary-600" : "bg-card text-ink"
                }`}
              >
                {d.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
