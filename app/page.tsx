"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { IntakeQuestion, NoticeExtraction, NoticeSource, PipelineResult } from "@/engine";
import type { LlmStatus } from "@/lib/llm";
import type { AnalyzeRequest, AnalyzeResponse, SampleCard } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import { SampleBoard } from "@/components/sample-board";
import { DecodingState } from "@/components/decoding-state";
import { ResultView } from "@/components/result-view";
import { IntakeRefine } from "@/components/intake-refine";

type Origin =
  | { type: "sample"; sampleId: string }
  | { type: "notice"; packId: string; userFacts: { answers: Record<string, string | number | boolean> }; extraction: NoticeExtraction };

type Phase =
  | { kind: "idle" }
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

export default function HomePage() {
  const [samples, setSamples] = useState<SampleCard[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d: { samples: SampleCard[] }) => setSamples(d.samples))
      .catch(() => setSamples([]));
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

  const pickSample = useCallback(
    (sampleId: string) =>
      run({ mode: "sample", sampleId, language }, { type: "sample", sampleId }, { showDecoding: true }),
    [run, language],
  );

  const uploadNotice = useCallback(
    async (source: NoticeSource) => {
      setPhase({ kind: "decoding" });
      setBusy(true);
      try {
        const data = await callAnalyze({
          mode: "notice",
          packId: "benefits",
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
    [language],
  );

  // Re-run on language change or intake refine, keeping the result on screen.
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

  if (phase.kind === "decoding") {
    return (
      <main className="min-h-screen bg-paper">
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

  // idle + error share the landing
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 text-center">
          <p className="mb-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            W<span className="ai-letters">ai</span>ve
          </p>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Information &amp; document prep, not legal advice
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Drop a notice.
            <br />
            Watch dread become a plan.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            An official notice, a short deadline, and a hidden remedy you’d never find in time. Waive
            reads the letter and routes you to the escape hatch before the clock runs out.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground/90">
            <Sparkles className="mr-1 inline size-3.5 text-primary" />
            Deadlines and remedies are computed by tested code that shows its work. The model only
            translates — it never decides your legal outcome.
          </p>
        </header>

        {phase.kind === "error" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warn" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">We couldn’t decode that.</p>
              <p className="text-foreground/80">{phase.message}</p>
              {phase.code === "extraction_failed" && (
                <p className="text-muted-foreground">
                  Live reading needs a local vision model (Ollama). You can still try a sample below —
                  those run fully offline.
                </p>
              )}
            </div>
          </div>
        )}

        <UploadZone onSelect={uploadNotice} busy={busy} />

        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            or pick a sample — judge’s choice
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SampleBoard samples={samples} onPick={pickSample} busy={busy} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          One domain-blind engine (“Backstop”) + pluggable rule packs. Same code, different injustice.
        </p>
      </div>
    </main>
  );
}
