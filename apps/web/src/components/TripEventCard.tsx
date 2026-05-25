"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { googleCalendarAddUrl } from "@/lib/google-calendar-url";
import type { CalendarEvent } from "@/lib/types";

function subtitleLine(event: CalendarEvent) {
  const parts: string[] = [];
  if (event.place_name) parts.push(event.place_name);
  if (event.hours_label) parts.push(event.hours_label);
  return parts.join(" · ");
}

export function TripEventCard({
  event,
  defaultOpen = false,
}: {
  event: CalendarEvent;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const sub = subtitleLine(event);
  const tags = (event.notes ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <div className="w-[4.5rem] shrink-0">
          <p className="text-sm font-bold text-[#b85c38]">
            {formatTime(event.starts_at)}
          </p>
          {event.ends_at !== event.starts_at ? (
            <p className="text-xs text-muted">{formatTime(event.ends_at)}</p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink">{event.title}</h3>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
            />
          </div>
          {sub ? (
            <p className="mt-1 text-sm text-muted">{sub}</p>
          ) : null}
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5 px-4 pb-4 pt-2">
          {event.place_name ? (
            <p className="mb-2 inline-flex rounded-full bg-shell px-2.5 py-1 text-xs text-muted">
              📍 {event.address ?? event.place_name}
            </p>
          ) : null}
          {event.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">
              {event.description}
            </p>
          ) : null}
          {event.bring_items && event.bring_items.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Bring / wear
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-ink/85">
                {event.bring_items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#b85c38]/10 px-2 py-0.5 text-xs font-medium text-[#b85c38]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <a
            href={googleCalendarAddUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Add to Google Calendar
          </a>
        </div>
      )}
    </article>
  );
}

export function TripDriveChip({ event }: { event: CalendarEvent }) {
  const label =
    event.hours_label ??
    event.description?.split("\n")[0]?.slice(0, 60) ??
    event.title;
  return (
    <p className="py-1 text-center text-xs italic text-muted">
      🚗 {label}
    </p>
  );
}
