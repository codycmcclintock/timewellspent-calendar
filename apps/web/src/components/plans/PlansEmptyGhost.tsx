const GHOST_TRIPS = [
  { title: "Joshua Tree", dates: "May 15–18", gradient: "from-primary-700/40 to-primary-500/25" },
  { title: "Tulum", dates: "June · 5 days", gradient: "from-primary-500/30 to-primary-300/20" },
  { title: "Big Sur", dates: "Flexible", gradient: "from-primary-600/35 to-planner" },
];

export function PlansEmptyGhost({ dimmed = true }: { dimmed?: boolean }) {
  return (
    <div
      className={`space-y-3 transition-opacity duration-300 ${
        dimmed ? "pointer-events-none opacity-40" : "opacity-100"
      }`}
      aria-hidden
    >
      {GHOST_TRIPS.map((t) => (
        <div
          key={t.title}
          className="overflow-hidden rounded-2xl bg-card ring-1 ring-black/5"
        >
          <div className={`h-20 bg-gradient-to-br ${t.gradient}`} />
          <div className="p-4">
            <p className="font-serif text-lg font-semibold text-ink">{t.title}</p>
            <p className="text-sm text-muted">{t.dates}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
