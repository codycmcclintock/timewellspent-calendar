import Image from "next/image";
import Link from "next/link";

export function AppHeader({
  displayName,
  partnerName,
  showInviteLink,
}: {
  displayName: string | null;
  partnerName: string | null;
  showInviteLink: boolean;
}) {
  const firstName = displayName?.split(/\s+/)[0] ?? "there";

  return (
    <header className="sticky top-0 z-40 border-b border-coral/10 bg-shell/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <Image
          src="/ruffles-logo.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
          priority
        />
        <p className="font-serif text-lg font-semibold text-ink">Ruffles</p>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        Hi, {firstName}
        {partnerName ? (
          <>
            {" "}
            · <span className="text-ink/80">with {partnerName}</span>
          </>
        ) : showInviteLink ? (
          <>
            {" "}
            ·{" "}
            <Link href="/profile" className="font-medium text-coral underline-offset-2 hover:underline">
              Invite your person
            </Link>
          </>
        ) : null}
      </p>
    </header>
  );
}
