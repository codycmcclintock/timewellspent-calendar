"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export function TripCreatedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") !== "1") return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4000);
    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    router.replace(url.pathname + url.search, { scroll: false });
    return () => clearTimeout(t);
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed left-4 right-4 top-4 z-[100] mx-auto max-w-lg rounded-xl bg-ink px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
    >
      Trip created.
    </div>
  );
}
