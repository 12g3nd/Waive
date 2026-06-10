"use client";

import { useState } from "react";
import { Check, ClipboardCopy, FileSignature, ListChecks, Printer } from "lucide-react";
import type { DraftedDocument, ResolvedCitation } from "@/engine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/citation-chip";

interface DocumentPreviewProps {
  doc: DraftedDocument;
  citations: ResolvedCitation[];
}

function toPlainText(doc: DraftedDocument): string {
  const lines = [
    doc.title,
    doc.formNumber ? `Form ${doc.formNumber}` : "",
    "",
    doc.coverExplanation,
    "",
    ...doc.body.flatMap((s) => [s.heading.toUpperCase(), s.content, ""]),
    "FILING CHECKLIST",
    ...doc.filingChecklist.map((c, i) => `${i + 1}. ${c.text}`),
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

export function DocumentPreview({ doc, citations }: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(toPlainText(doc));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <Card className="print-doc">
      <CardContent className="space-y-5 p-6">
        {/* Print-only letterhead — what a filed copy should carry, not the UI chrome. */}
        <div className="hidden print:block">
          <p className="font-display text-xl font-semibold tracking-tight">{doc.title}</p>
          {doc.formNumber && <p className="text-sm">Form {doc.formNumber}</p>}
          <p className="mt-1 text-xs leading-relaxed">
            Prepared with Waive — information and document preparation, not legal advice. Check
            every detail against your own notice before filing.
          </p>
          <hr className="mt-3 border-border" />
        </div>

        {/* On-screen header + actions (excluded from the printout). */}
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileSignature className="size-5 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Your draft</h2>
              <p className="text-sm text-muted-foreground">
                {doc.title}
                {doc.source === "deterministic-fallback" && " · structured draft"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc.formNumber && <Badge variant="neutral">{doc.formNumber}</Badge>}
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check /> : <ClipboardCopy />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Paper-like preview */}
        <div className="space-y-4 rounded-xl border border-border bg-background/60 p-5">
          <p className="text-sm italic text-foreground/75">{doc.coverExplanation}</p>
          {doc.body.map((s) => (
            <div key={s.id} className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {s.heading}
              </h4>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {s.content}
              </p>
            </div>
          ))}
        </div>

        {/* Filing checklist */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">How &amp; where to file</h3>
          </div>
          <ol className="space-y-2">
            {doc.filingChecklist.map((c, i) => (
              <li key={c.id} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[0.7rem] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="space-x-2">
                  <span className="text-foreground/90">{c.text}</span>
                  {c.citationId && <CitationChip id={c.citationId} citations={citations} />}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
