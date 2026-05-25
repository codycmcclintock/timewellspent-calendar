"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { weekStartISO, formatWeekLabel, prevWeek, nextWeek } from "@/lib/dates";
import type { CalendarEvent, Draft } from "@/lib/types";
import { TodaySchedule } from "./TodaySchedule";
import { WeekGrid } from "./WeekGrid";
import { UpcomingFeed } from "./UpcomingFeed";
import { FutureDrafts } from "./FutureDrafts";

const tabs = [
  { id: "today", label: "Today" },
  { id: "this-week", label: "This Week" },
  { id: "upcoming", label: "Upcoming" },
  { id: "future", label: "Future" },
] as const;

export function HomeTabs({
  todayEvents,
  weekEvents,
  upcomingEvents,
  drafts,
  coupleId,
  userId,
  weekStart,
  today,
}: {
  todayEvents: CalendarEvent[];
  weekEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  drafts: Draft[];
  coupleId: string;
  userId: string;
  weekStart: Date;
  today: Date;
}) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as (typeof tabs)[number]["id"]) || "today";

  return (
    <div>
      <Link
        href="/record?mode=weekly"
        className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#2563eb]/80 py-4 text-sm font-semibold text-white shadow-md"
      >
        <Mic className="h-5 w-5" />
        Plan your week
      </Link>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-black/5">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/home?tab=${t.id}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-[#2563eb] text-white" : "text-[#6b7280]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "today" && (
        <TodaySchedule
          initialEvents={todayEvents}
          coupleId={coupleId}
          userId={userId}
          date={today}
        />
      )}
      {tab === "this-week" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={`/home?tab=this-week&week=${weekStartISO(prevWeek(weekStart))}`}
              className="rounded-full p-2 hover:bg-card"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <p className="text-sm font-medium">{formatWeekLabel(weekStart)}</p>
            <Link
              href={`/home?tab=this-week&week=${weekStartISO(nextWeek(weekStart))}`}
              className="rounded-full p-2 hover:bg-card"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <WeekGrid weekStart={weekStart} events={weekEvents} userId={userId} />
        </>
      )}
      {tab === "upcoming" && (
        <UpcomingFeed events={upcomingEvents} userId={userId} />
      )}
      {tab === "future" && <FutureDrafts drafts={drafts} />}
    </div>
  );
}
