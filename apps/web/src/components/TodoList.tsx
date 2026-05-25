"use client";

import { useState, useTransition } from "react";
import { createTodo, toggleTodo } from "@/app/actions";
import type { Todo } from "@/lib/types";

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!title.trim()) return;
    startTransition(async () => {
      const t = await createTodo(title.trim());
      setTodos([t as Todo, ...todos]);
      setTitle("");
    });
  }

  function toggle(id: string, done: boolean) {
    startTransition(async () => {
      await toggleTodo(id, done);
      setTodos(
        todos.map((t) =>
          t.id === id
            ? { ...t, completed_at: done ? new Date().toISOString() : null }
            : t,
        ),
      );
    });
  }

  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
      <h3 className="font-semibold text-ink">To-do</h3>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
          placeholder="Pack sunscreen…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="rounded-full bg-shell px-4 text-sm font-medium"
        >
          Add
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {todos.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!t.completed_at}
              onChange={(e) => toggle(t.id, e.target.checked)}
            />
            <span
              className={`text-sm ${t.completed_at ? "text-muted line-through" : "text-ink"}`}
            >
              {t.title}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
