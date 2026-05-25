"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Mic, MicOff, Sparkles, Upload } from "lucide-react";
import {
  importJoshuaTreeCalendar,
  populateTripFromVoice,
} from "@/app/actions";
import { formatActionError } from "@/lib/format-action-error";

const PLACEHOLDER = `Example: Friday pick her up at 6, dinner at home, Saturday Joshua Tree — farmers market, horse sanctuary, Hidden Valley hike, nice dinner at Kitchen in the Desert…`;

export function TripPlannerPanel({ hasEvents }: { hasEvents: boolean }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleListen() {
    setError(null);
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      setError("Voice input works in Chrome or Safari on this device.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = text;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + chunk.trim();
        } else {
          interim += chunk;
        }
      }
      setText(finalTranscript + (interim ? ` ${interim}` : ""));
    };

    recognition.onerror = () => {
      setListening(false);
      setError("Could not hear you — check mic permissions or type instead.");
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function runAi() {
    setError(null);
    startTransition(async () => {
      try {
        await populateTripFromVoice(text, true);
        setText("");
      } catch (e) {
        setError(formatActionError(e));
      }
    });
  }

  function runImport() {
    setError(null);
    startTransition(async () => {
      try {
        await importJoshuaTreeCalendar();
      } catch (e) {
        setError(formatActionError(e));
      }
    });
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#2563eb]/8 via-card to-[#b85c38]/10 p-5 ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2563eb] text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">
            Plan with your voice
          </h2>
          <p className="mt-1 text-sm text-muted">
            Talk or paste your trip — AI turns it into a beautiful schedule.
          </p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={5}
        className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
      />

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleListen}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
            listening
              ? "bg-[#b85c38] text-white"
              : "bg-white text-ink ring-1 ring-black/10"
          }`}
        >
          {listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {listening ? "Stop" : "Speak"}
        </button>
        <button
          type="button"
          disabled={pending || text.trim().length < 8}
          onClick={runAi}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 min-w-[140px]"
        >
          <Sparkles className="h-4 w-4" />
          {pending ? "Building…" : "Build trip"}
        </button>
      </div>

      {!hasEvents ? (
        <button
          type="button"
          disabled={pending}
          onClick={runImport}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[#b85c38]/40 bg-white/60 py-2.5 text-sm font-medium text-[#b85c38]"
        >
          <Upload className="h-4 w-4" />
          {pending ? "Importing…" : "Import full Joshua Tree calendar (27 events)"}
        </button>
      ) : null}
    </section>
  );
}
