"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updatePlanDayTheme } from "@/app/actions";
import type { PlanDayTheme } from "@/lib/types";

export function DayThemeEditor({
  planId,
  dayKey,
  theme,
}: {
  planId: string;
  dayKey: string;
  theme: PlanDayTheme | null;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(theme?.title ?? "");
  const [subtitle, setSubtitle] = useState(theme?.subtitle ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updatePlanDayTheme(planId, dayKey, title, subtitle);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        <input
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm font-serif font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Day theme"
        />
        <input
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle"
        />
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="text-sm font-medium text-primary-500"
        >
          Save theme
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-primary-500"
    >
      <Pencil className="h-3 w-3" />
      {theme ? "Edit theme" : "Add a theme…"}
    </button>
  );
}
