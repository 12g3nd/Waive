import { CheckCircle2, ChevronDown, Scale, ShieldAlert } from "lucide-react";
import type { DeadlineResult, RemedyDecision, ResolvedCitation } from "@/engine";
import { humanDate } from "@/engine/dates";
import { Card, CardContent } from "@/components/ui/card";
import { CitationChip } from "@/components/citation-chip";

interface RemedyPanelProps {
  remedy: RemedyDecision;
  deadlines: DeadlineResult;
  citations: ResolvedCitation[];
}

export function RemedyPanel({ remedy, deadlines, citations }: RemedyPanelProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Your route</h2>
        </div>

        {/* The routed remedy, highlighted. */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.06] p-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <CheckCircle2 className="size-4" /> Recommended
            </span>
            <CitationChip id={remedy.selected.citationId} citations={citations} />
          </div>
          <p className="font-display text-lg font-semibold leading-snug">{remedy.selected.label}</p>
          <p className="mt-1 text-sm text-foreground/80">{remedy.selected.why}</p>
        </div>

        {/* Integrity note — we won't tell everyone to fight everything. */}
        {remedy.integrityNote && (
          <div className="flex gap-2.5 rounded-xl border border-warn/40 bg-warn/10 p-3.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-warn">Integrity check</p>
              <p className="mt-0.5 text-sm text-foreground/80">{remedy.integrityNote}</p>
            </div>
          </div>
        )}

        {/* Alternatives — and one line on why not. */}
        {remedy.alternatives.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Other paths
            </p>
            <ul className="space-y-2">
              {remedy.alternatives.map((alt) => (
                <li key={alt.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium text-foreground/80">{alt.label}</span>
                  <span className="text-muted-foreground">— {alt.whyNot}</span>
                  <CitationChip id={alt.citationId} citations={citations} className="ml-auto" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show your work — every deadline's derivation. */}
        {deadlines.deadlines.length > 0 && (
          <details className="group rounded-xl border border-border bg-secondary/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3.5 text-sm font-semibold">
              <span>Show your work — how each deadline was computed</span>
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-3 border-t border-border p-3.5">
              {deadlines.deadlines.map((d) => (
                <li key={d.id} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{d.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {humanDate(d.dateISO)}
                    </span>
                  </div>
                  <p className="rounded-md bg-card p-2 font-mono text-[0.72rem] leading-relaxed text-foreground/75">
                    {d.rule}
                  </p>
                  <CitationChip id={d.citationId} citations={citations} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
