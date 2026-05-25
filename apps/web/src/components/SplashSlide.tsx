"use client";

import Image from "next/image";
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
  const thumbOpacity = useTransform(x, [0, 220], [1, 0.85]);
  const trackWidth = 300;

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
    if (current > trackWidth * 0.55) {
      animate(x, trackWidth - 56, { duration: 0.22 }).then(() => setRevealed(true));
    } else {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative h-36 w-36 sm:h-40 sm:w-40">
            <Image
              src="/ruffles-logo.png"
              alt="Ruffles"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="mt-8 font-serif text-2xl font-semibold tracking-tight text-[#1a1a1a]">
            Ruffles
          </h1>
          <p className="mt-2 max-w-[260px] text-base leading-snug text-[#6b7280]">
            Where plans happen
          </p>
          <p className="mt-1 text-sm text-[#9ca3af]">Adventures made easy</p>
        </motion.div>
      </div>

      <div className="w-full max-w-sm shrink-0 px-8 pb-12 pt-2 mx-auto">
        {authError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Sign-in failed</p>
            <p className="mt-1">{authError}</p>
          </div>
        ) : null}

        {!revealed ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9ca3af]">
              Slide to continue
            </p>
            <div
              className="relative h-[3.25rem] w-full max-w-[300px] overflow-hidden rounded-full bg-[#e8e8ed] shadow-inner"
              style={{ maxWidth: trackWidth }}
            >
              <p className="pointer-events-none absolute inset-0 flex items-center justify-end pr-5 text-sm font-medium text-[#9ca3af]">
                →
              </p>
              <motion.button
                type="button"
                aria-label="Slide to continue"
                style={{ x, opacity: thumbOpacity }}
                drag="x"
                dragConstraints={{ left: 0, right: trackWidth - 56 }}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={onDragEnd}
                className="absolute left-1 top-1 flex h-11 w-11 cursor-grab items-center justify-center rounded-full bg-[#e85d4a] shadow-md ring-2 ring-white active:cursor-grabbing"
              >
                <span className="sr-only">Continue</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="mb-1 text-center text-sm text-[#6b7280]">
              Sign in to start planning together
            </p>
            <button
              type="button"
              onClick={() => signIn("apple")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a1a] py-3.5 text-sm font-semibold text-white"
            >
              Sign in with Apple
            </button>
            <button
              type="button"
              onClick={() => signIn("google")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#d1d5db] bg-white py-3.5 text-sm font-semibold text-[#1a1a1a] shadow-sm"
            >
              Sign in with Google
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
