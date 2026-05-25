"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { createEvent } from "@/app/actions";
import type { EventScope } from "@/lib/types";

export function EventSheet({
  open,
  onClose,
  defaultStart,
  planId,
}: {
  open: boolean;
  onClose: () => void;
  defaultStart: Date;
  planId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<EventScope>("us");
  const [date, setDate] = useState(format(defaultStart, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  if (!open) return null;

  function submit() {
    startTransition(async () => {
      const starts_at = new Date(`${date}T${startTime}:00`).toISOString();
      const ends_at = new Date(`${date}T${endTime}:00`).toISOString();
      await createEvent({
        title,
        scope,
        starts_at,
        ends_at,
        plan_id: planId,
      });
      setTitle("");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
        <h3 className="font-serif text-xl font-semibold">Add to calendar</h3>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            placeholder="What are we doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            {(["us", "mine"] as EventScope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  scope === s ? "bg-[#2563eb] text-white" : "bg-[#f5f5f7] text-[#6b7280]"
                }`}
              >
                {s === "us" ? "Us" : "Mine"}
              </button>
            ))}
          </div>
          <input
            type="date"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="time"
              className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="time"
              className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-black/10 py-3 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!title || pending}
            onClick={submit}
            className="flex-1 rounded-full bg-[#2563eb] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
