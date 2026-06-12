import { CheckCircle2, Scale, ShieldAlert } from "lucide-react";
import type { RemedyDecision, ResolvedCitation } from "@/engine";
import { Card, CardContent } from "@/components/ui/card";
import { CitationChip } from "@/components/citation-chip";
import { t } from "@/lib/i18n";

interface RemedyPanelProps {
  remedy: RemedyDecision;
  citations: ResolvedCitation[];
  language: string;
}

export function RemedyPanel({ remedy, citations, language }: RemedyPanelProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t(language, "remedy.yourRoute")}
          </h2>
        </div>

        {/* The routed remedy, highlighted. */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.06] p-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <CheckCircle2 className="size-4" /> {t(language, "remedy.recommended")}
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
              <p className="text-xs font-bold uppercase tracking-wider text-warn">
                {t(language, "remedy.integrityCheck")}
              </p>
              <p className="mt-0.5 text-sm text-foreground/80">{remedy.integrityNote}</p>
            </div>
          </div>
        )}

        {/* Alternatives — and one line on why not. */}
        {remedy.alternatives.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(language, "remedy.otherPaths")}
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
      </CardContent>
    </Card>
  );
}
