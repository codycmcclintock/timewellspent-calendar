"use client";

import { useEffect, useState } from "react";

const KEY = "ruffles-sync-delight";

export function SyncDelightBanner({ partnerName }: { partnerName: string }) {
  const [show, setShow] = useState(false);
  const first = partnerName.split(/\s+/)[0] ?? "Your partner";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY) === "1") return;
    setShow(true);
    sessionStorage.setItem(KEY, "1");
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-lg rounded-2xl bg-primary-500 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
    >
      {first} will see this on the shared calendar within an hour
    </div>
  );
}
