import { LifeBuoy } from "lucide-react";
import type { ConfidenceReport } from "@/engine";
import { cn } from "@/lib/utils";

const LEVEL = {
  high: { label: "High confidence", tone: "text-safe", bar: "bg-safe", w: "w-full" },
  medium: { label: "Medium confidence", tone: "text-warn", bar: "bg-warn", w: "w-2/3" },
  low: { label: "Low confidence", tone: "text-urgent", bar: "bg-urgent", w: "w-1/3" },
} as const;

interface ConfidencePanelProps {
  confidence: ConfidenceReport;
}

export function ConfidencePanel({ confidence }: ConfidencePanelProps) {
  const meta = LEVEL[confidence.level];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reading confidence
        </span>
        <span className={cn("text-sm font-semibold", meta.tone)}>{meta.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", meta.bar, meta.w)} />
      </div>

      {confidence.lowConfidenceFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Double-check these fields from the notice:{" "}
          <span className="font-medium text-foreground/80">
            {confidence.lowConfidenceFields.join(", ")}
          </span>
        </p>
      )}

      {confidence.escalate && (
        <div className="flex gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.07] p-3.5">
          <LifeBuoy className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/85">
            {confidence.escalationReason ??
              "This case has a genuine judgment call, have a legal-aid clinic review it."}
          </p>
        </div>
      )}
    </div>
  );
}
