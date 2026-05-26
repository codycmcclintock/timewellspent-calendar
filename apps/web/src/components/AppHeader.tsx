import Image from "next/image";
import Link from "next/link";
import { INVITE_HEADER_CTA } from "@/lib/partner-copy";

export function AppHeader({
  displayName,
  partnerName,
  showInviteLink,
  inviteUrl,
}: {
  displayName: string | null;
  partnerName: string | null;
  showInviteLink: boolean;
  inviteUrl?: string | null;
}) {
  const firstName = displayName?.split(/\s+/)[0] ?? "there";

  return (
    <header className="sticky top-0 z-40 border-b border-primary-500/10 bg-shell/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Image
            src="/ruffles-logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 object-contain"
            priority
          />
          <div>
            <p className="font-serif text-lg font-semibold text-ink">Ruffles</p>
            <p className="text-xs text-muted">
              Hi, {firstName}
              {partnerName ? (
                <>
                  {" "}
                  · <span className="text-ink/80">with {partnerName}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        {showInviteLink && inviteUrl ? (
          <Link
            href="/profile"
            className="shrink-0 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            {INVITE_HEADER_CTA}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
