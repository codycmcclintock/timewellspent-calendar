import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Plan } from "@/lib/types";

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Link
      href={`/plans/${plan.slug}`}
      className="block overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5"
    >
      <div className="relative h-44 bg-stone-300">
        {plan.cover_image_url && (
          <img
            src={plan.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p className="text-xl font-bold text-white">{plan.title}</p>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
            <ArrowUpRight className="h-4 w-4 text-ink" />
          </span>
        </div>
      </div>
      {plan.description && (
        <p className="line-clamp-2 p-3 text-sm text-muted">{plan.description}</p>
      )}
    </Link>
  );
}
