"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { googleCalendarAddUrl } from "@/lib/google-calendar-url";
import type { CalendarEvent } from "@/lib/types";

export function ItineraryStopCard({
  event,
  stopNumber,
  defaultOpen = false,
}: {
  event: CalendarEvent;
  stopNumber: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetail =
    Boolean(event.description) ||
    Boolean(event.bring_items?.length) ||
    Boolean(event.place_name);

  return (
    <article className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-black/5">
      <div className="flex w-8 shrink-0 flex-col items-center pt-0.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
          {stopNumber}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-coral/10 px-2 py-0.5 text-xs font-semibold text-coral">
              {formatTime(event.starts_at)}
              {event.ends_at !== event.starts_at
                ? ` – ${formatTime(event.ends_at)}`
                : ""}
            </span>
            <h3 className="mt-1 font-semibold leading-snug text-ink">{event.title}</h3>
            {event.place_name ? (
              <p className="mt-0.5 text-sm text-muted">{event.place_name}</p>
            ) : null}
          </div>
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-terracotta/25 to-coral/15" />
          )}
        </div>

        {hasDetail ? (
          <>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-coral"
            >
              {open ? "Hide details" : "Details"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open ? (
              <div className="mt-2 border-t border-black/5 pt-2 text-sm">
                {event.description ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-ink/90">
                    {event.description}
                  </p>
                ) : null}
                {event.bring_items && event.bring_items.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-muted">
                    {event.bring_items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <a
                  href={googleCalendarAddUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Add to Google Calendar
                </a>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
}
