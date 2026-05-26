"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Map, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", icon: CalendarDays },
  { href: "/plans", label: "Plans", icon: Map },
  { href: "/profile", label: "You", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-primary-500/10 bg-white pb-safe shadow-[0_-4px_20px_rgba(229,75,42,0.08)]">
      <div className="mx-auto flex max-w-lg justify-around px-4 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium ${
                active ? "text-coral" : "text-muted"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
