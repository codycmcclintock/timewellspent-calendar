"use client";

import dynamic from "next/dynamic";

/** Client-only so dismiss state never causes SSR hydration mismatches on Home. */
export const PartnerInviteBanner = dynamic(
  () =>
    import("@/components/PartnerInviteBanner").then(
      (mod) => mod.PartnerInviteBanner,
    ),
  { ssr: false },
);
