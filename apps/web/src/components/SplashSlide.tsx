"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

const oauthBtnClass =
  "relative flex w-full items-center justify-center rounded-full border border-[#e5e7eb] bg-white py-3.5 text-[15px] font-semibold text-ink shadow-sm transition hover:bg-[#fafafa] active:scale-[0.99]";

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
    const nextPath = searchParams.get("next") ?? "/onboarding";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

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
            className="flex flex-col gap-3"
          >
            <p className="mb-1 text-center text-sm text-muted">
              Sign in to start planning together
            </p>
            <button
              type="button"
              onClick={() => signIn("google")}
              className={oauthBtnClass}
            >
              <span className="absolute left-5 flex h-5 w-5 items-center justify-center">
                <GoogleIcon />
              </span>
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={() => signIn("apple")}
              className={oauthBtnClass}
            >
              <span className="absolute left-5 flex h-5 w-5 items-center justify-center text-ink">
                <AppleIcon />
              </span>
              Sign in with Apple
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
