import Link from "next/link";
import { Plus } from "lucide-react";

export function PlanCreateCard() {
  return (
    <Link
      href="/plans/new"
      className="mb-4 flex items-center gap-4 rounded-2xl bg-card p-4 ring-2 ring-coral/25 transition hover:ring-coral/45"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral text-white shadow-md">
        <Plus className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">Create new plan</p>
        <p className="text-sm text-muted">Pick where and when — then save reels to your list</p>
      </div>
    </Link>
  );
}
