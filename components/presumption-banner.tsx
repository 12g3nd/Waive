import { Sparkles } from "lucide-react";
import type { PresumptionResult, ResolvedCitation } from "@/engine";
import { Badge } from "@/components/ui/badge";
import { CitationChip } from "@/components/citation-chip";
import { t } from "@/lib/i18n";

const STRENGTH_KEY: Record<string, string> = {
  automatic: "presumption.automatic",
  likely: "presumption.likely",
  possible: "presumption.possible",
};

interface PresumptionBannerProps {
  presumptions: PresumptionResult;
  citations: ResolvedCitation[];
  language: string;
}

/** The jaw-drop: a fired not-at-fault presumption, rendered with a highlighter sweep. */
export function PresumptionBanner({ presumptions, citations, language }: PresumptionBannerProps) {
  if (presumptions.catches.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-highlight/50 bg-highlight/15">
      <div className="flex items-center gap-2 border-b border-highlight/40 bg-highlight/25 px-5 py-2.5">
        <Sparkles className="size-4 text-highlight-foreground" />
        <span className="text-xs font-bold uppercase tracking-widest text-highlight-foreground">
          {t(language, "presumption.title")}
        </span>
      </div>
      <ul className="divide-y divide-highlight/30">
        {presumptions.catches.map((c) => (
          <li key={c.id} className="space-y-2 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="highlight">
                {STRENGTH_KEY[c.strength] ? t(language, STRENGTH_KEY[c.strength]!) : c.strength}
              </Badge>
              <CitationChip id={c.citationId} citations={citations} />
            </div>
            <p className="font-display text-lg font-semibold leading-snug">
              <span className="marker">{c.headline}</span>
            </p>
            <p className="text-sm text-foreground/80">{c.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
