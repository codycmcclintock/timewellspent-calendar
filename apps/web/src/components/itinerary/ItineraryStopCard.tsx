"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Copy, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { googleCalendarAddUrl } from "@/lib/google-calendar-url";
import { itemTypeIcon } from "@/lib/item-type-icons";
import { deletePlanEvent, duplicatePlanEvent } from "@/app/actions";
import type { CalendarEvent } from "@/lib/types";

export function ItineraryStopCard({
  event,
  stopNumber,
  planSlug,
  defaultOpen = false,
}: {
  event: CalendarEvent;
  stopNumber: number;
  planSlug: string;
  defaultOpen?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const icon = itemTypeIcon(event.item_type ?? event.category);
  const subline = [
    event.place_name,
    event.estimated_cost,
    event.driving_duration_min ? `${event.driving_duration_min} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasDetail =
    Boolean(event.description) ||
    Boolean(event.bring_items?.length) ||
    Boolean(event.place_name) ||
    Boolean(event.address);

  return (
    <article className="rounded-2xl bg-card p-3 ring-1 ring-black/5">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
          {stopNumber}
        </span>
        <span className="text-2xl leading-none" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-500">
            {formatTime(event.starts_at)}
            {event.ends_at !== event.starts_at
              ? ` – ${formatTime(event.ends_at)}`
              : ""}
          </span>
          <h3 className="mt-1 font-semibold leading-snug text-ink">{event.title}</h3>
          {subline ? (
            <p className="mt-0.5 text-xs text-muted">{subline}</p>
          ) : null}
        </div>
      </div>

      {hasDetail ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-500"
          >
            {open ? "Hide details" : "Details"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open ? (
            <div className="mt-2 border-t border-black/5 pt-2 text-sm leading-relaxed">
              {event.description ? (
                <p className="whitespace-pre-wrap text-ink/90">{event.description}</p>
              ) : null}
              {event.address ? (
                <p className="mt-2 text-muted">{event.address}</p>
              ) : null}
              {event.bring_items && event.bring_items.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-muted">
                  {event.bring_items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={googleCalendarAddUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Google Calendar
                </a>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await duplicatePlanEvent(event.id, planSlug);
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deletePlanEvent(event.id, planSlug);
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
