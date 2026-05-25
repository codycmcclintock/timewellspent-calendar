"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { format, parseISO } from "date-fns";
import type { ProposedEvent } from "@/lib/voice-events-schema";

function confidenceClass(c: string) {
  if (c === "high") return "bg-emerald-100 text-emerald-800";
  if (c === "low") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

export function ProposedEventCard({
  event,
  onUpdate,
  onRemove,
}: {
  event: ProposedEvent;
  onUpdate: (e: ProposedEvent) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(event);

  function saveEdit() {
    onUpdate(draft);
    setEditing(false);
  }

  const dayLabel = format(parseISO(event.starts_at), "EEE MMM d");

  if (editing) {
    return (
      <article className="rounded-2xl bg-card p-4 ring-2 ring-[#2563eb]/30">
        <input
          className="mb-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <textarea
          className="mb-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          rows={3}
          value={draft.description ?? ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <input
          className="mb-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          placeholder="Location"
          value={draft.location ?? ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              location: e.target.value,
              place_name: e.target.value,
              address: e.target.value,
            })
          }
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            className="flex-1 rounded-lg border border-black/10 px-2 py-2 text-xs"
            value={draft.starts_at.slice(0, 16)}
            onChange={(e) =>
              setDraft({
                ...draft,
                starts_at: new Date(e.target.value).toISOString(),
              })
            }
          />
          <input
            type="datetime-local"
            className="flex-1 rounded-lg border border-black/10 px-2 py-2 text-xs"
            value={draft.ends_at.slice(0, 16)}
            onChange={(e) =>
              setDraft({
                ...draft,
                ends_at: new Date(e.target.value).toISOString(),
              })
            }
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={saveEdit}
            className="flex-1 rounded-full bg-[#2563eb] py-2 text-sm font-semibold text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-black/10 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{dayLabel}</p>
          <h3 className="font-semibold text-ink">{event.title}</h3>
          <p className="mt-0.5 text-sm text-[#b85c38]">
            {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
          </p>
          {event.location ? (
            <p className="mt-1 text-sm text-muted">{event.location}</p>
          ) : null}
          {event.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/80">
              {event.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceClass(event.confidence)}`}
            >
              {event.confidence}
            </span>
            {event.needs_confirmation?.map((f) => (
              <span
                key={f}
                className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900 ring-1 ring-amber-200/80"
              >
                Check {f}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            aria-label="Edit"
            onClick={() => {
              setDraft(event);
              setEditing(true);
            }}
            className="rounded-full p-2 text-muted hover:bg-black/5"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Remove"
            onClick={onRemove}
            className="rounded-full p-2 text-muted hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
