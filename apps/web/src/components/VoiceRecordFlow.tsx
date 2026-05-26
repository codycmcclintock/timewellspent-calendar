"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  confirmProposedEvents,
  parseVoiceTranscript,
} from "@/app/actions";
import { sessionPrompt, type VoiceParseMode } from "@/lib/voice-session-prompts";
import { formatActionError } from "@/lib/format-action-error";
import type { ProposedEvent } from "@/lib/voice-events-schema";
import { ProposedEventCard } from "@/components/ProposedEventCard";

type Phase = "idle" | "recording" | "parsing" | "review";

export function VoiceRecordFlow({
  mode,
  planSlug,
}: {
  mode: VoiceParseMode;
  planSlug?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [proposed, setProposed] = useState<ProposedEvent[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const prompt = sessionPrompt(mode);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function toggleRecord() {
    setError(null);
    if (phase === "recording") {
      recognitionRef.current?.stop();
      setPhase("idle");
      return;
    }

    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!Ctor) {
      setError("Voice works in Chrome or Safari. You can type below instead.");
      setPhase("idle");
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = transcript;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += (finalText ? " " : "") + chunk.trim();
        } else {
          interim += chunk;
        }
      }
      setTranscript(finalText + (interim ? ` ${interim}` : ""));
    };

    recognition.onerror = () => {
      setPhase("idle");
      setError("Mic issue — check permissions or type your plan below.");
    };

    recognition.onend = () => {
      setPhase((p) => (p === "recording" ? "idle" : p));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setPhase("recording");
  }

  function runParse() {
    setError(null);
    setPhase("parsing");
    startTransition(async () => {
      try {
        const events = await parseVoiceTranscript(transcript, mode, planSlug);
        if (events.length === 0) {
          setError(
            "No concrete plans found — try mentioning specific times and places.",
          );
          setPhase("idle");
          return;
        }
        setProposed(events);
        setSelected(Object.fromEntries(events.map((e) => [e.clientId, true])));
        setPhase("review");
      } catch (e) {
        setError(formatActionError(e));
        setPhase("idle");
      }
    });
  }

  function addAll() {
    setError(null);
    const toAdd = proposed.filter((e) => selected[e.clientId] !== false);
    if (toAdd.length === 0) {
      setError("Select at least one moment to add.");
      return;
    }
    startTransition(async () => {
      try {
        await confirmProposedEvents(toAdd, {
          planSlug: planSlug ?? (mode === "trip" ? "joshua-tree" : undefined),
        });
        if (mode === "trip" || planSlug) {
          router.push(`/plans/${planSlug ?? "joshua-tree"}`);
        } else {
          router.push("/home?tab=upcoming");
        }
      } catch (e) {
        setError(formatActionError(e));
      }
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <p className="text-center font-serif text-2xl font-semibold text-ink">
        {prompt}
      </p>

      {phase !== "review" ? (
        <>
          <div className="mt-6 min-h-[200px] flex-1 overflow-y-auto rounded-2xl bg-card/80 p-4 ring-1 ring-black/5">
            {transcript ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {transcript}
              </p>
            ) : (
              <p className="text-sm text-muted">
                {phase === "recording"
                  ? "Listening…"
                  : "Tap the button and talk, or type here."}
              </p>
            )}
            <div ref={transcriptEndRef} />
            <textarea
              className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              rows={4}
              placeholder="Or type your week here…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </div>

          {error ? (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {phase === "parsing" ? (
            <div className="mt-8 flex flex-col items-center gap-3 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-coral border-t-transparent" />
              <p className="text-sm font-medium text-muted">
                Pulling out the moments…
              </p>
            </div>
          ) : (
            <div className="mt-auto flex flex-col items-center gap-4 pb-4 pt-8">
              {transcript.trim().length >= 8 && phase !== "recording" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={runParse}
                  className="w-full max-w-sm rounded-full bg-coral py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Pull out the moments
                </button>
              ) : null}
              <button
                type="button"
                onClick={toggleRecord}
                className={`flex h-28 w-full max-w-sm items-center justify-center rounded-full shadow-lg transition ${
                  phase === "recording"
                    ? "bg-primary-600 ring-4 ring-primary-500/30"
                    : "bg-primary-500 ring-4 ring-primary-500/20"
                }`}
                aria-label={phase === "recording" ? "Stop recording" : "Start recording"}
              >
                <span className="text-sm font-semibold text-white">
                  {phase === "recording" ? "Stop" : "Record"}
                </span>
              </button>
              <p className="text-xs text-muted">
                {phase === "recording" ? "Tap to stop" : "Tap to record"}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-4 text-center text-sm text-muted">
            {proposed.length} moments — skip any you don&apos;t want, then add.
          </p>
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pb-28">
            {proposed.map((e) => (
              <ProposedEventCard
                key={e.clientId}
                event={e}
                included={selected[e.clientId] !== false}
                onToggleIncluded={() =>
                  setSelected((s) => ({
                    ...s,
                    [e.clientId]: s[e.clientId] === false,
                  }))
                }
                onUpdate={(next) =>
                  setProposed((list) =>
                    list.map((x) => (x.clientId === e.clientId ? next : x)),
                  )
                }
                onRemove={() => {
                  setProposed((list) =>
                    list.filter((x) => x.clientId !== e.clientId),
                  );
                  setSelected((s) => {
                    const next = { ...s };
                    delete next[e.clientId];
                    return next;
                  });
                }}
              />
            ))}
          </div>
          {error ? (
            <p className="mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto max-w-lg px-4">
            <button
              type="button"
              disabled={
                pending ||
                proposed.filter((e) => selected[e.clientId] !== false).length ===
                  0
              }
              onClick={addAll}
              className="w-full rounded-full bg-primary-500 py-4 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {pending
                ? "Saving…"
                : `Add selected (${proposed.filter((e) => selected[e.clientId] !== false).length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
