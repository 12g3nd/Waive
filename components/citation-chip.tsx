import { ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ResolvedCitation } from "@/engine";
import { cn } from "@/lib/utils";

export function findCitation(
  citations: ResolvedCitation[],
  id: string,
): ResolvedCitation | undefined {
  return citations.find((c) => c.id === id);
}

interface CitationChipProps {
  id: string;
  citations: ResolvedCitation[];
  className?: string;
  /** Icon-only inline variant, for citing a source within a sentence of prose. */
  compact?: boolean;
}

/** A small linked chip rendering the real source for a legal claim. */
export function CitationChip({ id, citations, className, compact }: CitationChipProps) {
  const c = findCitation(citations, id);
  if (!c) return null;

  const label = c.officialCitation.replace(/^TODO_CITATION\s*/i, "").trim() || "source pending";
  const Body = compact ? (
    <>
      {c.verified ? (
        <ShieldCheck className="size-3 shrink-0" />
      ) : (
        <TriangleAlert className="size-3 shrink-0" />
      )}
      {c.sourceUrl && <ExternalLink className="size-2.5 shrink-0 opacity-60" />}
    </>
  ) : (
    <>
      {c.verified ? (
        <ShieldCheck className="size-3.5 shrink-0" />
      ) : (
        <TriangleAlert className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{c.verified ? c.officialCitation : `Unverified: ${label}`}</span>
      {c.sourceUrl && <ExternalLink className="size-3 shrink-0 opacity-60" />}
    </>
  );

  const classes = cn(
    compact
      ? "inline-flex items-center gap-0.5 rounded border px-1 py-0.5 align-middle transition-colors"
      : "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.72rem] font-medium transition-colors",
    c.verified
      ? "border-border bg-secondary/60 text-secondary-foreground hover:bg-secondary"
      : "border-warn/40 bg-warn/10 text-warn hover:bg-warn/15",
    className,
  );

  const title = c.verified ? `${c.sourceTitle} — ${c.summary}` : `${label} — ${c.summary}`;

  if (c.sourceUrl) {
    return (
      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className={classes} title={title}>
        {Body}
      </a>
    );
  }
  return (
    <span className={classes} title={title}>
      {Body}
    </span>
  );
}
