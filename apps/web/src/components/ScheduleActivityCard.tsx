"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Car,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { formatTime } from "@/lib/dates";
import { updateEvent } from "@/app/actions";
import { DetailIconRow } from "./DetailIconRow";
import type { CalendarEvent } from "@/lib/types";

function scopeLabel(scope: string, createdBy: string | null, userId: string) {
  if (scope === "us") return "Us";
  if (createdBy === userId) return "Yours";
  return "Theirs";
}

function scopeClass(scope: string, createdBy: string | null, userId: string) {
  if (scope === "us") return "bg-coral text-white";
  if (createdBy === userId) return "bg-[#b85c38]/15 text-[#b85c38]";
  return "bg-[#6b7280]/15 text-[#6b7280]";
}

export function ScheduleActivityCard({
  event,
  userId,
  defaultOpen = false,
}: {
  event: CalendarEvent;
  userId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    notes: event.notes ?? "",
    address: event.address ?? event.place_name ?? "",
    hours_label: event.hours_label ?? "",
    driving_distance_mi: event.driving_distance_mi?.toString() ?? "",
    cost_is_free: event.cost_is_free,
    cost_cents: event.cost_cents ? (event.cost_cents / 100).toString() : "",
  });

  function saveField(patch: Record<string, unknown>) {
    startTransition(async () => {
      await updateEvent(event.id, patch as Parameters<typeof updateEvent>[1]);
    });
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <div className="w-20 shrink-0">
          <p className="text-sm font-bold text-ink">
            {formatTime(event.starts_at)}
          </p>
          <p className="text-xs text-muted">{formatTime(event.ends_at)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink">{event.title}</h3>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
            />
          </div>
          {(event.place_name || event.description) && (
            <p className="mt-1 line-clamp-1 text-sm text-muted">
              {event.place_name ?? event.description}
            </p>
          )}
          <span
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${scopeClass(event.scope, event.created_by, userId)}`}
          >
            {scopeLabel(event.scope, event.created_by, userId)}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5 px-4 pb-4">
          <DetailIconRow icon={Clock} label="When" value={`${formatTime(event.starts_at)} – ${formatTime(event.ends_at)}`} />
          <DetailIconRow icon={MapPin} label="Place">
            <input
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              onBlur={() =>
                saveField({
                  address: form.address,
                  place_name: form.address,
                })
              }
              placeholder="Address or place name"
            />
          </DetailIconRow>
          <DetailIconRow icon={Car} label="Getting there">
            <input
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={form.driving_distance_mi}
              onChange={(e) =>
                setForm({ ...form, driving_distance_mi: e.target.value })
              }
              onBlur={() =>
                saveField({
                  driving_distance_mi: form.driving_distance_mi
                    ? parseFloat(form.driving_distance_mi)
                    : null,
                })
              }
              placeholder="Miles (optional)"
            />
          </DetailIconRow>
          <DetailIconRow icon={DollarSign} label="Cost">
            <div className="mt-1 flex gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.cost_is_free}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setForm({ ...form, cost_is_free: v });
                    saveField({ cost_is_free: v });
                  }}
                />
                Free
              </label>
              {!form.cost_is_free && (
                <input
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={form.cost_cents}
                  onChange={(e) =>
                    setForm({ ...form, cost_cents: e.target.value })
                  }
                  onBlur={() =>
                    saveField({
                      cost_cents: form.cost_cents
                        ? Math.round(parseFloat(form.cost_cents) * 100)
                        : null,
                    })
                  }
                  placeholder="$ amount"
                />
              )}
            </div>
          </DetailIconRow>
          <DetailIconRow icon={Calendar} label="Hours">
            <input
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={form.hours_label}
              onChange={(e) => setForm({ ...form, hours_label: e.target.value })}
              onBlur={() => saveField({ hours_label: form.hours_label || null })}
              placeholder="e.g. Open 7am–2pm"
            />
          </DetailIconRow>
          <DetailIconRow icon={FileText} label="Notes">
            <textarea
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              onBlur={() => saveField({ notes: form.notes || null })}
              placeholder="Add notes…"
            />
          </DetailIconRow>
          {pending && (
            <p className="text-xs text-muted">Saving…</p>
          )}
        </div>
      )}
    </article>
  );
}
