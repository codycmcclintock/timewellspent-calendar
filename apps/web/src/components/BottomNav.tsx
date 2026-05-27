"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Map, Settings, User } from "lucide-react";

const tabs = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/home", label: "Home", icon: CalendarDays },
  { href: "/plans", label: "Plans", icon: Map },
  { href: "/profile", label: "You", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-primary-500/10 bg-white pb-safe shadow-[0_-4px_20px_rgba(229,75,42,0.08)]">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/settings"
              ? pathname === "/settings"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium sm:text-xs ${
                active ? "text-coral" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={active ? 2.5 : 2} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
