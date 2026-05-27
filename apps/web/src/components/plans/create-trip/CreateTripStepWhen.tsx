"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { WhenSelection } from "@/components/plans/PlanWhenPicker";
import {
  buildFlexibleMonthOptions,
  nightCount,
} from "@/lib/create-trip-dates";

type WhenMode = "flexible_month" | "exact";

export function CreateTripStepWhen({
  destinationLabel,
  value,
  onChange,
}: {
  destinationLabel: string;
  value: WhenSelection;
  onChange: (w: WhenSelection) => void;
}) {
  const months = useMemo(() => buildFlexibleMonthOptions(12), []);
  const initialMode: WhenMode =
    value.dateMode === "exact" && value.startsOn ? "exact" : "flexible_month";

  const [mode, setMode] = useState<WhenMode>(initialMode);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [calendarStart, setCalendarStart] = useState(0);

  const today = startOfDay(new Date());
  const flexMonth =
    value.flexibleMonth ?? months[0]?.value ?? format(today, "yyyy-MM");
  const nights = value.tripLengthDays ?? 3;

  const viewMonthA = startOfMonth(addMonths(today, calendarStart));
  const viewMonthB = startOfMonth(addMonths(today, calendarStart + 1));

  function setFlexible(patch: Partial<WhenSelection>) {
    onChange({
      dateMode: "flexible_month",
      flexibleMonth: flexMonth,
      tripLengthDays: nights,
      startsOn: undefined,
      endsOn: undefined,
      ...patch,
    });
  }

  function switchMode(next: WhenMode) {
    setMode(next);
    if (next === "flexible_month") {
      setFlexible({});
    } else {
      onChange({
        ...value,
        dateMode: "exact",
      });
    }
  }

  function onDayTap(iso: string) {
    const d = parseISO(iso);
    if (isBefore(d, today)) return;

    if (!rangeStart || rangeStart > iso) {
      setRangeStart(iso);
      onChange({
        dateMode: "exact",
        startsOn: iso,
        endsOn: undefined,
        tripLengthDays: value.tripLengthDays ?? 3,
        flexibleMonth: undefined,
      });
      return;
    }

    const n = nightCount(rangeStart, iso);
    onChange({
      dateMode: "exact",
      startsOn: rangeStart,
      endsOn: iso,
      tripLengthDays: n || value.tripLengthDays || 3,
      flexibleMonth: undefined,
    });
    setRangeStart(null);
  }

  function isInRange(iso: string) {
    if (!value.startsOn) return false;
    const end = value.endsOn ?? value.startsOn;
    return iso >= value.startsOn && iso <= end;
  }

  function renderMonth(monthStart: Date) {
    const days = eachDayOfInterval({
      start: monthStart,
      end: endOfMonth(monthStart),
    });
    const leadingBlanks = getDay(monthStart);

    return (
      <div key={monthStart.toISOString()} className="mb-4">
        <p className="mb-2 text-sm font-medium text-ink">
          {format(monthStart, "MMMM yyyy")}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={`${format(monthStart, "yyyy-MM")}-${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const past = isBefore(day, today);
            const endpoint =
              value.startsOn === iso || value.endsOn === iso;
            const inRange = isInRange(iso);
            return (
              <button
                key={iso}
                type="button"
                disabled={past}
                onClick={() => onDayTap(iso)}
                className={`aspect-square rounded-full text-xs ${
                  past
                    ? "text-black/20"
                    : endpoint
                      ? "bg-primary-500 font-semibold text-white"
                      : inRange
                        ? "bg-primary-50 text-ink"
                        : "text-ink hover:bg-shell"
                }`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <p className="text-center text-xs font-medium text-muted">{destinationLabel}</p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Step 2 of 3
      </p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
        When are you thinking?
      </h2>
      <p className="mt-1 text-sm text-muted">
        Lock it in if you know — or just pick a month.
      </p>

      <div className="mt-5 flex rounded-full bg-shell p-1 ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => switchMode("flexible_month")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
            mode === "flexible_month"
              ? "bg-card text-ink shadow-sm"
              : "text-muted"
          }`}
        >
          I&apos;m flexible
        </button>
        <button
          type="button"
          onClick={() => switchMode("exact")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
            mode === "exact"
              ? "bg-card text-ink shadow-sm"
              : "text-muted"
          }`}
        >
          Exact dates
        </button>
      </div>

      {mode === "flexible_month" ? (
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Pick a month
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {months.map((m) => {
              const monthDate = parseISO(`${m.value}-01`);
              const past = isBefore(endOfMonth(monthDate), today);
              const active = flexMonth === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={past}
                  onClick={() =>
                    setFlexible({ flexibleMonth: m.value })
                  }
                  className={`rounded-xl border px-2 py-3 text-center text-sm font-semibold transition ${
                    past
                      ? "border-transparent text-black/25"
                      : active
                        ? "border-transparent bg-ink text-white"
                        : "border-black/10 bg-card text-ink"
                  }`}
                >
                  {m.short}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                    {format(monthDate, "yyyy")}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-wide text-muted">
            How many nights?
          </p>
          <p className="mt-2 font-serif text-5xl font-semibold text-ink">
            {nights}
            <span className="ml-2 text-lg font-normal text-muted">nights</span>
          </p>
          <input
            type="range"
            min={1}
            max={14}
            value={Math.min(nights, 14)}
            onChange={(e) =>
              setFlexible({ tripLengthDays: Number(e.target.value) })
            }
            className="mt-3 w-full accent-primary-500"
          />
          {nights >= 14 ? (
            <p className="mt-2 text-xs text-muted">
              Need longer? You can extend after creating the trip.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 max-h-[40vh] overflow-y-auto rounded-2xl bg-card p-3 ring-1 ring-black/5">
          {renderMonth(viewMonthA)}
          {renderMonth(viewMonthB)}
          {calendarStart < 10 ? (
            <button
              type="button"
              onClick={() => setCalendarStart((s) => s + 2)}
              className="w-full py-2 text-sm font-medium text-primary-500"
            >
              Show more months
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
