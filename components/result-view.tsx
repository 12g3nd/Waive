"use client";

import type { ReactNode } from "react";
import { RotateCcw, Building2, Hash, CircleDollarSign, User, Loader2 } from "lucide-react";
import type { PipelineResult } from "@/engine";
import { t } from "@/lib/i18n";
import { diffDays, humanDate } from "@/engine/dates";
import { formatMoney } from "@/engine/format";
import type { LlmStatus } from "@/lib/llm";
import { engineLabel } from "@/lib/llm/model-label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeadlineClock } from "@/components/deadline-clock";
import { AddToCalendar } from "@/components/add-to-calendar";
import { ExplanationPanel } from "@/components/explanation-panel";
import { RemedyPanel } from "@/components/remedy-panel";
import { DecisionTrace } from "@/components/decision-trace";
import { PresumptionBanner } from "@/components/presumption-banner";
import { DocumentPreview } from "@/components/document-preview";
import { CitationsPanel } from "@/components/citations-panel";
import { ConfidencePanel } from "@/components/confidence-panel";
import { AskPanel } from "@/components/ask-panel";
import { LanguageToggle } from "@/components/language-toggle";

const ASK_SUGGESTIONS: Record<string, string[]> = {
  benefits: [
    "Can this debt be cancelled?",
    "What happens if I do nothing?",
    "How do I know if I'm at fault?",
  ],
  answer: [
    "Can this debt be too old to collect?",
    "What if I miss the deadline?",
    "Do they have to prove they own it?",
  ],
};

function buildGrounding(result: PipelineResult): string {
  const e = result.extraction;
  const primary =
    result.deadlines.deadlines.find((d) => d.id === result.deadlines.primaryDeadlineId) ??
    result.deadlines.deadlines[0];
  const parts = [`This is a ${e.claimType} from ${e.issuer}.`];
  if (primary) parts.push(`Key deadline: ${primary.label} on ${humanDate(primary.dateISO)}.`);
  parts.push(`Routed remedy: ${result.remedy.selected.label} — ${result.remedy.selected.why}`);
  if (result.presumptions.catches.length) {
    parts.push(`Findings: ${result.presumptions.catches.map((c) => c.headline).join(" ")}`);
  }
  return parts.join(" ");
}

interface ResultViewProps {
  result: PipelineResult;
  llm: LlmStatus;
  language: string;
  onLanguage: (lang: string) => void;
  busy: boolean;
  /** True only while re-translating after a language switch — drives the overlay. */
  translating?: boolean;
  onReset: () => void;
  refineSlot?: ReactNode;
}

function NoticeSummary({ result }: { result: PipelineResult }) {
  const e = result.extraction;
  const facts = [
    { icon: Building2, label: "From", value: e.issuer },
    { icon: User, label: "For", value: e.recipientName ?? "—" },
    {
      icon: CircleDollarSign,
      label: "Amount",
      value: e.amount !== null ? formatMoney(e.amount, e.currency) : "—",
    },
    {
      icon: Hash,
      label: "Reference",
      value: Object.values(e.identifiers)[0] ?? "—",
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {facts.map((f) => (
        <div key={f.label} className="flex items-start gap-2">
          <f.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {f.label}
            </dt>
            <dd className="truncate text-sm font-medium" title={f.value}>
              {f.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function ResultView({
  result,
  llm,
  language,
  onLanguage,
  busy,
  translating = false,
  onReset,
  refineSlot,
}: ResultViewProps) {
  const { deadlines, extraction } = result;
  const primary =
    deadlines.deadlines.find((d) => d.id === deadlines.primaryDeadlineId) ??
    deadlines.deadlines[0];
  const anchor = extraction.noticeDate ?? extraction.serviceOrReceiptDate;
  const windowDays = primary && anchor ? Math.max(1, diffDays(anchor, primary.dateISO)) : 30;

  const delay = (i: number) => ({ animationDelay: `${i * 90}ms` });

  return (
    <div
      lang={language}
      className="relative mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6"
      aria-busy={translating}
    >
      {/* While switching language the page re-translates in place — dim it and show a
          clear spinner so the person knows it's working, not frozen. */}
      {translating && (
        <div
          className="absolute inset-0 z-20 flex items-start justify-center bg-paper/70 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <div className="sticky top-24 mt-24 inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            {t(language, "common.translating")}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <Badge variant={llm.mode === "offline" ? "outline" : "primary"}>
          {engineLabel(llm.mode, llm.config)}
        </Badge>
        <div className="flex items-center gap-2">
          <LanguageToggle value={language} onChange={onLanguage} disabled={busy} />
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw /> Start over
          </Button>
        </div>
      </div>

      {/* Decoded-notice band: the dread, turned into a clock + the facts. */}
      <Card className="animate-fade-up overflow-hidden" style={delay(0)}>
        <CardContent className="grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col items-center justify-center gap-4 border-b border-border pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            {primary ? (
              <>
                <DeadlineClock
                  dateISO={primary.dateISO}
                  label={primary.label}
                  description={deadlines.pauseWindow?.description}
                  windowDays={windowDays}
                  isProtected={primary.protected}
                />
                <AddToCalendar result={result} />
              </>
            ) : (
              <div className="max-w-xs text-center">
                <p className="font-display text-2xl font-semibold text-urgent">No clock yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn&apos;t read a date to start the deadline from. See the review note below.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {result.packDisplayName} · decoded
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {extraction.claimType}
              </h1>
            </div>
            <NoticeSummary result={result} />
          </div>
        </CardContent>
      </Card>

      {/* The catch (jaw-drop) */}
      {result.presumptions.catches.length > 0 && (
        <div className="animate-fade-up" style={delay(1)}>
          <PresumptionBanner presumptions={result.presumptions} citations={result.citations} />
        </div>
      )}

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="animate-fade-up" style={delay(2)}>
            <ExplanationPanel
              explanation={result.explanation}
              engine={engineLabel(llm.mode, llm.config)}
            />
          </div>
          <div className="animate-fade-up" style={delay(3)}>
            <RemedyPanel remedy={result.remedy} citations={result.citations} />
          </div>
          <div className="animate-fade-up" style={delay(4)}>
            <DocumentPreview doc={result.draftedDocument} citations={result.citations} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="animate-fade-up" style={delay(2)}>
            <ConfidencePanel confidence={result.confidence} />
          </div>
          <div className="animate-fade-up" style={delay(3)}>
            <AskPanel
              domain={result.domain}
              language={language}
              grounding={buildGrounding(result)}
              caseSources={result.citations.map((c) => ({
                topic: c.topic,
                summary: c.summary,
                cite: c.officialCitation,
              }))}
              suggestions={ASK_SUGGESTIONS[result.domain] ?? ["What does this mean?", "What is my deadline?"]}
            />
          </div>
          {refineSlot && (
            <div className="animate-fade-up" style={delay(3)}>
              {refineSlot}
            </div>
          )}
          <div className="animate-fade-up" style={delay(4)}>
            <CitationsPanel citations={result.citations} />
          </div>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Waive is <strong>information and document preparation, not legal advice</strong>. It is a
            force-multiplier for legal-aid orgs and advocates, not a lawyer. When in doubt, have a
            clinic review your case.
          </p>
        </div>
      </div>

      {/* The audit layer: the whole deterministic chain, made visible. */}
      <div className="animate-fade-up" style={delay(5)}>
        <DecisionTrace result={result} />
      </div>
    </div>
  );
}
