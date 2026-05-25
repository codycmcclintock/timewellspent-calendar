"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function readAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search);
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code =
    fromQuery.get("error_code") ?? fromHash.get("error_code") ?? fromQuery.get("error");
  const desc =
    fromQuery.get("error_description") ?? fromHash.get("error_description");
  if (!code && !desc) return null;
  return desc ? decodeURIComponent(desc.replace(/\+/g, " ")) : code;
}

export function SplashSlide() {
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const next = searchParams.get("next") ?? "/onboarding";
      window.location.replace(
        `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`,
      );
      return;
    }

    const err =
      searchParams.get("error_description")?.replace(/\+/g, " ") ??
      (searchParams.get("error") === "auth"
        ? "Sign-in could not be completed. Try again."
        : null) ??
      readAuthError();
    setAuthError(err);
    if (err && (searchParams.get("error") || searchParams.get("error_code"))) {
      setRevealed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 200], [1, 0.3]);

  const supabase = createClient();

  async function signIn(provider: "google" | "apple") {
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback`;

    if (provider === "google") {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes:
            "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo },
    });
  }

  function onDragEnd() {
    const current = x.get();
    if (current > 160) {
      animate(x, 280, { duration: 0.2 }).then(() => setRevealed(true));
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1501785881917-7a2b7e9a3f1e?w=1200&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#b85c38]/30 via-black/25 to-black/50" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-14">
        <p className="font-serif text-2xl font-semibold tracking-tight text-white drop-shadow">
          Ruffles
        </p>

        <div className="mt-auto max-w-sm">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-white drop-shadow">
            Where plans happen
          </h1>
          <p className="mt-2 text-lg text-white/90">Adventures made easy</p>
        </div>

        <div className="mt-10">
          {authError ? (
            <div className="mb-4 rounded-2xl border border-red-200/80 bg-red-950/80 px-4 py-3 text-sm text-red-50 backdrop-blur">
              <p className="font-semibold">Sign-in failed</p>
              <p className="mt-1 text-red-100/90">{authError}</p>
              <p className="mt-2 text-xs text-red-100/70">
                Usually: re-copy Google Client ID + Secret into Supabase →
                Authentication → Providers → Google, then save.
              </p>
            </div>
          ) : null}
          {!revealed ? (
            <div className="relative h-14 overflow-hidden rounded-full bg-white/20 backdrop-blur">
              <p className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-white/90">
                Slide →
              </p>
              <motion.button
                type="button"
                style={{ x, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 280 }}
                dragElastic={0}
                onDragEnd={onDragEnd}
                className="absolute left-1 top-1 flex h-12 cursor-grab items-center rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-lg active:cursor-grabbing"
              >
                Continue
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => signIn("apple")}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-[#1a1a1a] shadow-md"
              >
                Sign in with Apple
              </button>
              <button
                type="button"
                onClick={() => signIn("google")}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-white/15 py-3.5 text-sm font-semibold text-white backdrop-blur"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
