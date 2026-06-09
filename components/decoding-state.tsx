"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";

const STEPS = [
  "Reading the notice…",
  "Finding the date that starts the clock…",
  "Computing your protected window…",
  "Checking the not-at-fault rules…",
  "Routing you to the right remedy…",
  "Drafting your form + filing checklist…",
];

export function DecodingState() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="relative h-44 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        {/* faux notice lines */}
        <div className="space-y-2 p-4">
          <div className="h-2 w-3/4 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-5/6 rounded bg-muted" />
          <div className="h-2 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-2 w-1/2 rounded bg-urgent/40" />
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-4/6 rounded bg-muted" />
        </div>
        {/* scanning sweep */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 animate-[scan_1.6s_ease-in-out_infinite] bg-gradient-to-b from-primary/30 to-transparent" />
        <ScanLine className="absolute bottom-2 right-2 size-4 text-primary" />
      </div>

      <div className="space-y-1">
        <p className="font-display text-xl font-semibold tracking-tight">Decoding…</p>
        <p className="text-sm text-muted-foreground transition-opacity" key={i} aria-live="polite">
          {STEPS[i]}
        </p>
      </div>

      <style>{`@keyframes scan { 0%{transform:translateY(-100%)} 50%{transform:translateY(380%)} 100%{transform:translateY(-100%)} }`}</style>
    </div>
  );
}
