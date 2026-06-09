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
            "group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(20,20,30,0.4)] disabled:opacity-60",
            TONE_RING[s.tone],
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Badge variant={s.tone === "primary" ? "primary" : s.tone === "urgent" ? "urgent" : "highlight"}>
              {s.badge}
            </Badge>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold leading-tight">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.blurb}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
