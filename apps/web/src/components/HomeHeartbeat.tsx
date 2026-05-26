import Link from "next/link";
import { differenceInDays, format, parseISO } from "date-fns";
import type { CalendarEvent, Plan } from "@/lib/types";

export function HomeHeartbeat({
  nextPlan,
  recentMoment,
  partnerNextEvent,
  partnerName,
}: {
  nextPlan: Plan | null;
  recentMoment: CalendarEvent | null;
  partnerNextEvent: CalendarEvent | null;
  partnerName: string | null;
}) {
  const countdown =
    nextPlan?.starts_on &&
    differenceInDays(parseISO(nextPlan.starts_on), new Date()) >= 0
      ? differenceInDays(parseISO(nextPlan.starts_on), new Date())
      : null;

  if (!nextPlan && !recentMoment && !partnerNextEvent) return null;

  return (
    <section className="mb-6 space-y-3">
      {nextPlan && countdown !== null ? (
        <Link
          href={`/plans/${nextPlan.slug}`}
          className="block rounded-2xl bg-gradient-to-br from-primary-500/15 to-planner p-4 ring-1 ring-primary-500/20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Next adventure
          </p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink">
            {nextPlan.title}
          </p>
          <p className="mt-1 text-sm text-muted">
            {countdown === 0
              ? "Starts today"
              : countdown === 1
                ? "Starts tomorrow"
                : `In ${countdown} days`}
            {nextPlan.starts_on
              ? ` · ${format(parseISO(nextPlan.starts_on), "MMM d")}`
              : ""}
          </p>
        </Link>
      ) : null}

      {recentMoment ? (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
          <p className="text-xs font-medium text-sage">Recent moment</p>
          <p className="mt-1 font-medium text-ink">{recentMoment.title}</p>
          {recentMoment.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
              {recentMoment.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {partnerNextEvent && partnerName ? (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
          <p className="text-xs text-muted">
            {partnerName.split(/\s+/)[0]}&apos;s next on the calendar
          </p>
          <p className="mt-1 font-medium text-ink">{partnerNextEvent.title}</p>
          <p className="text-xs text-muted">
            {format(parseISO(partnerNextEvent.starts_at), "EEE, MMM d · h:mm a")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
