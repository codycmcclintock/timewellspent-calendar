import Link from "next/link";
import { MapPin } from "lucide-react";

export function FeaturedTripCard({
  href,
  title,
  dates,
  subtitle,
  coverImageUrl,
}: {
  href: string;
  title: string;
  dates: string;
  subtitle: string;
  coverImageUrl?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group mb-6 block overflow-hidden rounded-2xl bg-card ring-2 ring-coral/20 transition hover:ring-coral/40"
    >
      <div
        className="relative h-32 bg-gradient-to-br from-terracotta/40 via-coral/30 to-planner"
        style={
          coverImageUrl
            ? {
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.45), transparent), url(${coverImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coral">
          Your trip
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-coral">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-muted">{dates}</p>
            <p className="mt-1 text-sm text-ink/80">{subtitle}</p>
          </div>
          <MapPin className="h-5 w-5 shrink-0 text-coral" />
        </div>
        <p className="mt-3 text-sm font-medium text-coral">View itinerary →</p>
      </div>
    </Link>
  );
}
