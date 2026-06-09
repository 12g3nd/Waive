import { BookMarked, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ResolvedCitation } from "@/engine";
import { Card, CardContent } from "@/components/ui/card";

interface CitationsPanelProps {
  citations: ResolvedCitation[];
}

/** Every legal claim links to its real source. Unverified entries are flagged, not hidden. */
export function CitationsPanel({ citations }: CitationsPanelProps) {
  if (citations.length === 0) return null;
  const verifiedCount = citations.filter((c) => c.verified).length;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookMarked className="size-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">Sources</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {verifiedCount}/{citations.length} verified
          </span>
        </div>

        <ul className="space-y-3">
          {citations.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-secondary/25 p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold leading-snug">{c.topic}</p>
                  <p className="text-xs text-muted-foreground">{c.summary}</p>
                  <p className="font-mono text-[0.72rem] text-foreground/70">
                    {c.officialCitation}
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Used for: {c.usedFor.join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {c.verified ? (
                    <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-safe">
                      <ShieldCheck className="size-3.5" /> verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-warn">
                      <TriangleAlert className="size-3.5" /> unverified
                    </span>
                  )}
                  {c.sourceUrl && (
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-primary hover:underline"
                    >
                      source <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
