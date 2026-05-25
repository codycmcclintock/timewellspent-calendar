"use client";

import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/dates";
import type { CalendarEvent } from "@/lib/types";

export function UpcomingFeed({
  events,
  userId,
}: {
  events: CalendarEvent[];
  userId: string;
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-black/5">
        No upcoming plans yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((e) => (
        <Link
          key={e.id}
          href={`/day/${format(parseISO(e.starts_at), "yyyy-MM-dd")}?event=${e.id}`}
          className="block overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5"
        >
          <div className="relative h-36 bg-gradient-to-br from-stone-400 to-stone-600">
            {e.cover_image_url && (
              <img
                src={e.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-white">{e.title}</p>
                <p className="text-sm text-white/80">
                  {format(parseISO(e.starts_at), "EEE, MMM d")} ·{" "}
                  {formatTime(e.starts_at)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
