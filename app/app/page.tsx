"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { IntakeQuestion, NoticeExtraction, NoticeSource, PipelineResult } from "@/engine";
import type { LlmStatus } from "@/lib/llm";
import type { AnalyzeRequest, AnalyzeResponse, SampleCard } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SampleBoard } from "@/components/sample-board";
import { DecodingState } from "@/components/decoding-state";
import { ResultView } from "@/components/result-view";
import { IntakeRefine } from "@/components/intake-refine";
import { NoticeTypePicker } from "@/components/notice-type-picker";
import type { NoticeType } from "@/lib/notice-types";

type Origin =
  | { type: "sample"; sampleId: string }
  | { type: "notice"; packId: string; userFacts: { answers: Record<string, string | number | boolean> }; extraction: NoticeExtraction };

type Phase =
  | { kind: "idle" }
  | {
      kind: "review";
      source: NoticeSource;
      suggestion: { domain: string; label: string } | null;
      classifying: boolean;
    }
  | { kind: "decoding" }
  | { kind: "result"; result: PipelineResult; llm: LlmStatus; intake: IntakeQuestion[]; origin: Origin }
  | { kind: "error"; message: string; code: string };

async function callAnalyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return (await res.json()) as AnalyzeResponse;
}

/** The default packId for a guessed domain (first jurisdiction when it has several). */
function defaultPackIdForDomain(types: NoticeType[], domain: string): string | null {
  const t = types.find((x) => x.domain === domain);
  if (!t) return null;
  return t.packId ?? t.locations[0]?.packId ?? null;
}

function BackLink() {
  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div aria-hidden className="h-0.5 bg-highlight" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <Wordmark className="text-sm" />
        </Link>
        <ThemeToggle className="size-8" />
      </div>
    </div>
  );
}

function AppPage() {
  const searchParams = useSearchParams();
  const [samples, setSamples] = useState<SampleCard[]>([]);
  const [noticeTypes, setNoticeTypes] = useState<NoticeType[]>([]);
  const [noticePackId, setNoticePackId] = useState("benefits");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d: { samples: SampleCard[] }) => setSamples(d.samples))
      .catch(() => setSamples([]));
  }, []);

  useEffect(() => {
    fetch("/api/notice-types")
      .then((r) => r.json())
      .then((d: { noticeTypes: NoticeType[] }) => setNoticeTypes(d.noticeTypes))
      .catch(() => setNoticeTypes([]));
  }, []);

  const run = useCallback(
    async (req: AnalyzeRequest, origin: Origin, opts: { showDecoding: boolean }) => {
      if (opts.showDecoding) setPhase({ kind: "decoding" });
      setBusy(true);
      try {
        const data = await callAnalyze(req);
        if (data.ok) {
          setPhase({ kind: "result", result: data.result, llm: data.llm, intake: data.intake, origin });
        } else {
          setPhase({ kind: "error", message: data.error, code: data.code });
        }
      } catch (err) {
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
          code: "network",
        });
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // Auto-run sample from ?sample= query param on first mount
  useEffect(() => {
    const sampleId = searchParams.get("sample");
    if (sampleId) {
      void run(
        { mode: "sample", sampleId, language: "en" },
        { type: "sample", sampleId },
        { showDecoding: true },
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSample = useCallback(
    (sampleId: string) =>
      run({ mode: "sample", sampleId, language }, { type: "sample", sampleId }, { showDecoding: true }),
    [run, language],
  );

  const analyzeNotice = useCallback(
    async (source: NoticeSource) => {
      setPhase({ kind: "decoding" });
      setBusy(true);
      try {
        const data = await callAnalyze({
          mode: "notice",
          packId: noticePackId,
          userFacts: { answers: {} },
          language,
          source,
        });
        if (data.ok) {
          setPhase({
            kind: "result",
            result: data.result,
            llm: data.llm,
            intake: data.intake,
            origin: {
              type: "notice",
              packId: data.result.packId,
              userFacts: { answers: {} },
              extraction: data.result.extraction,
            },
          });
        } else {
          setPhase({ kind: "error", message: data.error, code: data.code });
        }
      } catch (err) {
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
          code: "network",
        });
      } finally {
        setBusy(false);
      }
    },
    [language, noticePackId],
  );

  // On upload, ask the model (if available) to guess the type, then let the person
  // confirm before we analyze. Degrades to a plain confirm step when there's no model.
  const onFileSelected = useCallback(
    async (source: NoticeSource) => {
      setPhase({ kind: "review", source, suggestion: null, classifying: true });
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
        const data = (await res.json()) as {
          available: boolean;
          domain?: string | null;
          label?: string;
        };
        if (data.available && data.domain && data.label) {
          const pid = defaultPackIdForDomain(noticeTypes, data.domain);
          if (pid) setNoticePackId(pid);
          const suggestion = { domain: data.domain, label: data.label };
          setPhase((p) => (p.kind === "review" ? { ...p, suggestion, classifying: false } : p));
        } else {
          setPhase((p) => (p.kind === "review" ? { ...p, classifying: false } : p));
        }
      } catch {
        setPhase((p) => (p.kind === "review" ? { ...p, classifying: false } : p));
      }
    },
    [noticeTypes],
  );

  const rerun = useCallback(
    (origin: Origin, lang: string, facts?: { answers: Record<string, string | number | boolean> }) => {
      if (origin.type === "sample") {
        return run({ mode: "sample", sampleId: origin.sampleId, language: lang }, origin, {
          showDecoding: false,
        });
      }
      const userFacts = facts ?? origin.userFacts;
      const nextOrigin: Origin = { ...origin, userFacts };
      return run(
        {
          mode: "notice",
          packId: origin.packId,
          userFacts,
          language: lang,
          source: { kind: "extraction", extraction: origin.extraction },
        },
        nextOrigin,
        { showDecoding: false },
      );
    },
    [run],
  );

  function handleLanguage(lang: string) {
    setLanguage(lang);
    if (phase.kind === "result") void rerun(phase.origin, lang);
  }

  if (phase.kind === "review") {
    const reviewPhase = phase;
    return (
      <main className="min-h-screen bg-paper">
        <BackLink />
        <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Check the notice type</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {reviewPhase.classifying
                  ? "Reading your file to suggest the type…"
                  : reviewPhase.suggestion
                    ? "We've pre-selected our best guess, change it below if it's not right."
                    : "Tell us what kind of notice this is so we apply the right rules."}
              </p>
            </div>

            {reviewPhase.suggestion && !reviewPhase.classifying && (
              <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/[0.07] p-3 text-sm">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-foreground/85">This looks like {reviewPhase.suggestion.label}.</p>
              </div>
            )}

            <NoticeTypePicker
              types={noticeTypes}
              value={noticePackId}
              onChange={setNoticePackId}
              disabled={busy}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void analyzeNotice(reviewPhase.source)}
                disabled={busy || reviewPhase.classifying}
              >
                Analyze this notice <ArrowRight />
              </Button>
              <Button variant="ghost" onClick={() => setPhase({ kind: "idle" })} disabled={busy}>
                Use a different file
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (phase.kind === "decoding") {
    return (
      <main className="min-h-screen bg-paper">
        <BackLink />
        <DecodingState />
      </main>
    );
  }

  if (phase.kind === "result") {
    const refineSlot =
      phase.origin.type === "notice" ? (
        <IntakeRefine
          questions={phase.intake}
          initial={phase.origin.userFacts.answers}
          busy={busy}
          onSubmit={(facts) =>
            phase.origin.type === "notice" && void rerun(phase.origin, language, facts)
          }
        />
      ) : undefined;

    return (
      <main className="min-h-screen bg-paper">
        <BackLink />
        <ResultView
          result={phase.result}
          llm={phase.llm}
          language={language}
          onLanguage={handleLanguage}
          busy={busy}
          onReset={() => setPhase({ kind: "idle" })}
          refineSlot={refineSlot}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <BackLink />
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="size-3.5 text-primary" />
            Information &amp; document prep, not legal advice
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Drop a notice.
            <br />
            Watch dread become <em className="italic">a plan.</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            An official notice, a short deadline, and a hidden remedy you'd never find in time. Waive
            reads the letter and routes you to the escape hatch before the clock runs out.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground/90">
            <Sparkles className="mr-1 inline size-3.5 text-primary" />
            Deadlines and remedies are computed by tested code that shows its work. The model only
            translates, it never decides your legal outcome.
          </p>
        </header>

        {phase.kind === "error" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warn" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">We couldn't decode that.</p>
              <p className="text-foreground/80">{phase.message}</p>
              {phase.code === "extraction_failed" && (
                <p className="text-muted-foreground">
                  Live reading needs a local vision model (Ollama). You can still try a sample below,
                  those run fully offline.
                </p>
              )}
            </div>
          </div>
        )}

        <UploadZone onSelect={onFileSelected} busy={busy} />

        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            or pick a sample notice
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SampleBoard samples={samples} onPick={pickSample} busy={busy} />

        <p className="mt-10 text-center font-mono text-[11px] tracking-wide text-muted-foreground">
          One domain-blind engine · pluggable rule packs · same code, different injustice
        </p>
      </div>
    </main>
  );
}

export default function AppPageWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-paper" />}>
      <AppPage />
    </Suspense>
  );
}
