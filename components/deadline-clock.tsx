"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { daysUntilLocal, humanDate } from "@/engine/dates";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface DeadlineClockProps {
  dateISO: string;
  label: string;
  description?: string;
  /** Length of the protective window (days) used to scale the ring. */
  windowDays?: number;
  isProtected?: boolean;
  language: string;
}

type Urgency = "safe" | "warn" | "urgent" | "expired";

function urgencyFor(daysLeft: number): Urgency {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 3) return "urgent";
  if (daysLeft <= 14) return "warn";
  return "safe";
}

const TONE: Record<Urgency, { stroke: string; text: string; ring: string }> = {
  safe: { stroke: "hsl(var(--safe))", text: "text-safe", ring: "" },
  warn: { stroke: "hsl(var(--warn))", text: "text-warn", ring: "" },
  urgent: { stroke: "hsl(var(--urgent))", text: "text-urgent", ring: "animate-pulseRing" },
  expired: { stroke: "hsl(var(--urgent))", text: "text-urgent", ring: "" },
};

export function DeadlineClock({
  dateISO,
  label,
  description,
  windowDays = 30,
  isProtected,
  language,
}: DeadlineClockProps) {
  // Compute on the client so the countdown is live and never mismatches SSR.
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  useEffect(() => {
    setDaysLeft(daysUntilLocal(dateISO));
  }, [dateISO]);

  const R = 92;
  const C = 2 * Math.PI * R;
  const days = daysLeft ?? windowDays;
  const urgency = urgencyFor(days);
  const tone = TONE[urgency];
  const remainingFrac = Math.max(0, Math.min(1, days / windowDays));
  const dash = C * remainingFrac;

  const a11yLabel =
    daysLeft === null
      ? `Loading countdown to ${label} on ${humanDate(dateISO)}`
      : urgency === "expired"
        ? `Deadline passed: ${label} was due ${humanDate(dateISO)}`
        : `${days} ${days === 1 ? "day" : "days"} left until ${label} on ${humanDate(dateISO)}`;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        role="img"
        aria-label={a11yLabel}
        className={cn("relative grid place-items-center rounded-full", tone.ring)}
      >
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90" aria-hidden="true">
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="14"
          />
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke={tone.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1), stroke 400ms" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          {daysLeft === null ? (
            <span className="font-display text-2xl text-muted-foreground">…</span>
          ) : urgency === "expired" ? (
            <>
              <span className={cn("font-display text-3xl font-bold", tone.text)}>
                {t(language, "clock.passed")}
              </span>
              <span className="mt-1 max-w-[8rem] text-xs text-muted-foreground">
                {t(language, "clock.passedBody")}
              </span>
            </>
          ) : (
            <>
              <span className={cn("font-display text-6xl font-bold leading-none tabular-nums", tone.text)}>
                {days}
              </span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {days === 1 ? t(language, "clock.dayLeft") : t(language, "clock.daysLeft")}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          {isProtected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
              <Lock className="size-3" /> {t(language, "clock.protectedWindow")}
            </span>
          )}
          <span className="font-mono text-sm font-medium">{humanDate(dateISO)}</span>
        </div>
        <p className="font-display text-lg font-medium tracking-tight">{label}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
