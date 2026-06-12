import { LifeBuoy } from "lucide-react";
import type { ConfidenceReport } from "@/engine";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const LEVEL = {
  high: { key: "confidence.high", tone: "text-safe", bar: "bg-safe", w: "w-full" },
  medium: { key: "confidence.medium", tone: "text-warn", bar: "bg-warn", w: "w-2/3" },
  low: { key: "confidence.low", tone: "text-urgent", bar: "bg-urgent", w: "w-1/3" },
} as const;

interface ConfidencePanelProps {
  confidence: ConfidenceReport;
  language: string;
}

export function ConfidencePanel({ confidence, language }: ConfidencePanelProps) {
  const meta = LEVEL[confidence.level];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t(language, "confidence.title")}
        </span>
        <span className={cn("text-sm font-semibold", meta.tone)}>{t(language, meta.key)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", meta.bar, meta.w)} />
      </div>

      {confidence.lowConfidenceFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t(language, "confidence.doubleCheck")}{" "}
          <span className="font-medium text-foreground/80">
            {confidence.lowConfidenceFields.join(", ")}
          </span>
        </p>
      )}

      {confidence.escalate && (
        <div className="flex gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.07] p-3.5">
          <LifeBuoy className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/85">
            {confidence.escalationReason ?? t(language, "confidence.escalateDefault")}
          </p>
        </div>
      )}
    </div>
  );
}
