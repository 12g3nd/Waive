"use client";

import { ArrowUpRight } from "lucide-react";
import type { SampleCard } from "@/lib/api-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SampleBoardProps {
  samples: SampleCard[];
  onPick: (sampleId: string) => void;
  busy?: boolean;
}

const TONE_RING: Record<SampleCard["tone"], string> = {
  primary: "hover:border-primary/60",
  urgent: "hover:border-urgent/60",
  highlight: "hover:border-highlight/70",
};

export function SampleBoard({ samples, onPick, busy }: SampleBoardProps) {
  if (samples.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {samples.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={busy}
          onClick={() => onPick(s.id)}
          className={cn(
            "group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(20,20,30,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
            TONE_RING[s.tone],
          )}
        >
          {s.imagePath && (
            <div className="relative h-28 overflow-hidden rounded-xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.imagePath}
                alt={`Sample notice: ${s.title}`}
                className="absolute inset-x-0 top-0 w-full select-none"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
            </div>
          )}
          <div className="flex items-center justify-between gap-2 px-2">
            <Badge variant={s.tone === "primary" ? "primary" : s.tone === "urgent" ? "urgent" : "highlight"}>
              {s.badge}
            </Badge>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="space-y-1 px-2 pb-1">
            <h3 className="font-display text-base font-semibold leading-tight">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.blurb}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
