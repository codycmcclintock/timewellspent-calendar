import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarLinkCard } from "@/components/CalendarLinkCard";
import { PartnerInviteBanner } from "@/components/PartnerInviteBannerClient";
import { TodoList } from "@/components/TodoList";
import type { CalendarEvent, Plan, Profile, Todo } from "@/lib/types";

export function CoupleDashboard({
  profile,
  partner,
  coupleName,
  daysTogether,
  nextPlan,
  feedUrl,
  inviteUrl,
  todos,
}: {
  profile: Profile;
  partner: Profile | null;
  coupleName: string | null;
  daysTogether: number;
  nextPlan: Plan | null;
  feedUrl: string;
  inviteUrl: string | null;
  todos: Todo[];
}) {
  const title = partner
    ? `You & ${partner.display_name?.split(/\s+/)[0] ?? "them"}`
    : "You";

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
        {coupleName ? (
          <p className="mt-1 text-sm text-muted">{coupleName}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          {daysTogether > 0
            ? `${daysTogether} day${daysTogether === 1 ? "" : "s"} planned together`
            : "Your adventure counter starts with your first plan."}
        </p>
      </section>

      <div className="flex items-center gap-4">
        <Avatar profile={profile} label="You" />
        {partner ? (
          <Avatar profile={partner} label={partner.display_name ?? "Partner"} />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-600">
            +
          </div>
        )}
      </div>

      {nextPlan ? (
        <Link
          href={`/plans/${nextPlan.slug}`}
          className="block rounded-2xl bg-planner p-4 ring-1 ring-primary-500/15"
        >
          <p className="text-xs font-medium text-primary-600">Next adventure</p>
          <p className="font-serif text-lg font-semibold text-ink">{nextPlan.title}</p>
          {nextPlan.starts_on ? (
            <p className="text-sm text-muted">
              {format(parseISO(nextPlan.starts_on), "MMM d")}
              {nextPlan.ends_on
                ? ` – ${format(parseISO(nextPlan.ends_on), "MMM d, yyyy")}`
                : ""}
            </p>
          ) : null}
        </Link>
      ) : null}

      {!partner && inviteUrl ? <PartnerInviteBanner inviteUrl={inviteUrl} /> : null}

      <section>
        <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
          Shared calendar
        </h3>
        <CalendarLinkCard feedUrl={feedUrl} />
      </section>

      <TodoList initialTodos={todos} />
    </div>
  );
}

function Avatar({ profile, label }: { profile: Profile; label: string }) {
  return (
    <div className="text-center">
      {profile.avatar_url ? (
        // OAuth avatars (Google, etc.) — plain img avoids next/image hostname failures
        <img
          src={profile.avatar_url}
          alt=""
          width={56}
          height={56}
          referrerPolicy="no-referrer"
          className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-primary-500/20"
        />
      ) : (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 font-serif text-lg font-semibold text-primary-700">
          {(profile.display_name ?? label).charAt(0).toUpperCase()}
        </div>
      )}
      <p className="mt-1 max-w-[80px] truncate text-xs text-muted">{label}</p>
    </div>
  );
}
