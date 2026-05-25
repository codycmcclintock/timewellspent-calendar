"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { addMonths, format } from "date-fns";

export type WhenSelection = {
  dateMode: "flexible_month" | "exact";
  flexibleMonth?: string;
  startsOn?: string;
  endsOn?: string;
  tripLengthDays: number;
};

function monthOptions() {
  const base = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = addMonths(base, i);
    return {
      label: format(d, "MMMM yyyy"),
      value: format(d, "yyyy-MM"),
    };
  });
}

export function PlanWhenPicker({
  value,
  onChange,
}: {
  value: WhenSelection;
  onChange: (v: WhenSelection) => void;
}) {
  const [mode, setMode] = useState<"flexible_month" | "exact">(value.dateMode);
  const months = monthOptions();

  return (
    <div>
      <div className="flex rounded-xl bg-shell p-1 ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => {
            setMode("flexible_month");
            onChange({ ...value, dateMode: "flexible_month" });
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "flexible_month" ? "bg-card text-ink shadow-sm" : "text-muted"
          }`}
        >
          I&apos;m flexible
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("exact");
            onChange({ ...value, dateMode: "exact" });
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "exact" ? "bg-card text-ink shadow-sm" : "text-muted"
          }`}
        >
          Exact dates
        </button>
      </div>

      {mode === "flexible_month" ? (
        <div className="mt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Calendar className="h-4 w-4 text-coral" />
            Go in
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {months.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    dateMode: "flexible_month",
                    flexibleMonth: m.value,
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  value.flexibleMonth === m.value
                    ? "border-coral bg-coral/10 text-coral"
                    : "border-black/10 text-muted"
                }`}
              >
                {format(new Date(`${m.value}-01`), "MMM")}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="flex items-center gap-2 font-semibold text-ink">
              <Calendar className="h-4 w-4 text-coral" />
              Start
            </span>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              value={value.startsOn ?? ""}
              onChange={(e) =>
                onChange({ ...value, dateMode: "exact", startsOn: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink">End</span>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              value={value.endsOn ?? ""}
              onChange={(e) =>
                onChange({ ...value, dateMode: "exact", endsOn: e.target.value })
              }
            />
          </label>
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">
          Trip length: {value.tripLengthDays} days
        </p>
        <input
          type="range"
          min={1}
          max={14}
          value={value.tripLengthDays}
          onChange={(e) =>
            onChange({ ...value, tripLengthDays: Number(e.target.value) })
          }
          className="mt-2 w-full accent-coral"
        />
      </div>
    </div>
  );
}
