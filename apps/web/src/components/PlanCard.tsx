import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Plan } from "@/lib/types";

function dateLabel(plan: Plan) {
  if (plan.date_mode === "exact" && plan.starts_on) {
    const start = format(parseISO(plan.starts_on), "MMM d");
    const end = plan.ends_on
      ? format(parseISO(plan.ends_on), "MMM d, yyyy")
      : "";
    return end ? `${start}–${end}` : start;
  }
  if (plan.flexible_month) {
    return format(parseISO(`${plan.flexible_month}-01`), "MMMM yyyy");
  }
  if (plan.starts_on && plan.ends_on) {
    return `${format(parseISO(plan.starts_on), "MMM d")}–${format(parseISO(plan.ends_on), "MMM d, yyyy")}`;
  }
  return "Dates TBD";
}

export function PlanCard({
  plan,
  eventCount,
  unsortedOnly,
  hasPartner,
}: {
  plan: Plan;
  eventCount?: number;
  unsortedOnly?: boolean;
  hasPartner?: boolean;
}) {
  const title = plan.destination ?? plan.title;
  const badge =
    eventCount != null && eventCount > 0
      ? unsortedOnly
        ? `${eventCount} idea${eventCount === 1 ? "" : "s"}`
        : `${eventCount} events`
      : null;

  return (
    <Link
      href={`/plans/${plan.slug}`}
      className="group block overflow-hidden rounded-2xl bg-card shadow-sm ring-2 ring-coral/15 transition hover:ring-coral/35"
    >
      <div className="relative h-44 bg-gradient-to-br from-terracotta/30 to-coral/20">
        {plan.cover_image_url && (
          <img
            src={plan.cover_image_url}
            alt=""
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-coral">
            {badge}
          </span>
        ) : null}
        {plan.status === "building" ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            Building
          </span>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="font-serif text-xl font-bold text-white">{title}</p>
            <p className="text-sm text-white/85">{dateLabel(plan)}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-coral">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      {plan.description ? (
        <p className="line-clamp-2 p-3 text-sm text-muted">{plan.description}</p>
      ) : (
        <p className="p-3 text-sm text-muted">
          {hasPartner ? "Tap to add reels and plan together" : "Tap to build your list — invite her when ready"}
        </p>
      )}
    </Link>
  );
}
