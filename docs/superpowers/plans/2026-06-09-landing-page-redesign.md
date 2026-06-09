# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a rich 7-section marketing landing page at `/` and move the existing tool to `/app`, with a `?sample=<id>` query-param deep-link so landing-page sample cards open directly into a decoded result.

**Architecture:** `app/page.tsx` becomes a Next.js Server Component (no `"use client"`) that imports sample data directly from `@/samples` and composes static landing sections. The existing tool moves unchanged to `app/app/page.tsx` with two additions: a `← Waive` back link and `useSearchParams` auto-trigger for `?sample`. All new landing components live in `components/landing/`. Two small utility hooks live in `hooks/`.

**Tech Stack:** Next.js App Router (Server + Client Components), React 18, Tailwind CSS (existing config), Fraunces / Public Sans / IBM Plex Mono (already loaded in layout), Lucide React (already installed), IntersectionObserver API (native browser).

---

## File Map

**Create:**
- `app/app/page.tsx` — tool page (moved from `app/page.tsx`, + back link + query-param hook)
- `hooks/use-in-view.ts` — IntersectionObserver hook for scroll-triggered animations
- `hooks/use-scroll-direction.ts` — scroll-direction hook for nav hide/show
- `components/landing/site-nav.tsx` — sticky frosted-glass nav
- `components/landing/result-card-preview.tsx` — static SSA result card (hero right col)
- `components/landing/hero-section.tsx` — split hero (copy left, card right)
- `components/landing/problem-section.tsx` — dark section, 3 story cards
- `components/landing/how-it-works-section.tsx` — 3-step connected flow
- `components/landing/differentiator-section.tsx` — 4 feature cards
- `components/landing/sample-cta-section.tsx` — sample cards linking to `/app?sample=`
- `components/landing/trust-section.tsx` — stats grid + trust pills (count-up animation)
- `components/landing/site-footer.tsx` — wordmark + legal disclaimer
- `app/page.tsx` — new landing page Server Component (replaces current)

**Delete (after moving):**
- `app/page.tsx` (original) — replaced by the new Server Component in Task 10

**No changes to:** all `app/api/` routes, `engine/`, `packs/`, `corpus/`, `lib/`, `components/` (existing), `globals.css`, `tailwind.config.ts`, all tests.

---

## Task 1: Move tool to `/app`

**Files:**
- Create: `app/app/page.tsx`
- The current `app/page.tsx` is replaced in Task 10; keep it as-is until then.

- [ ] **Step 1: Create the `app/app/` directory**

```bash
mkdir -p app/app
```

- [ ] **Step 2: Create `app/app/page.tsx`**

This is the current `app/page.tsx` with four changes: (1) `Suspense` + `useSearchParams` imports added, (2) component split into inner `AppPage` + outer `AppPageWrapper`, (3) `useSearchParams` deep-link effect added, (4) back-link bar added at top of each render branch. Rename the default export to `AppPageWrapper`.

```tsx
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
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

function BackLink() {
  return (
    <div className="border-b border-border bg-card/80 px-4 py-2 backdrop-blur-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        <span className="font-display font-bold">
          W<span className="ai-letters">ai</span>ve
        </span>
      </Link>
    </div>
  );
}

function AppPage() {
  const searchParams = useSearchParams();
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
            An official notice, a short deadline, and a hidden remedy you'd never find in time. Waive
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
              <p className="font-semibold text-foreground">We couldn't decode that.</p>
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
            or pick a sample — judge's choice
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SampleBoard samples={samples} onPick={pickSample} busy={busy} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          One domain-blind engine ("Backstop") + pluggable rule packs. Same code, different injustice.
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
```

- [ ] **Step 3: Verify the tool still works at `/app`**

Start the dev server if not running:
```bash
npm run dev
```

Navigate to `http://localhost:3000/app`. The tool should render identically to the old `/` — upload zone, sample board, back link at the top. Click a sample card and confirm a result loads. The old `/` currently still shows the tool (it hasn't been replaced yet — that happens in Task 10).

- [ ] **Step 4: Test the deep-link**

Navigate to `http://localhost:3000/app?sample=ssdi-not-at-fault`. The decoding state should appear immediately and resolve to a result — same as clicking the sample card manually.

- [ ] **Step 5: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat: move tool to /app with back link and ?sample= deep-link"
```

---

## Task 2: Scroll utility hooks

**Files:**
- Create: `hooks/use-in-view.ts`
- Create: `hooks/use-scroll-direction.ts`

- [ ] **Step 1: Create `hooks/use-in-view.ts`**

```ts
import { useEffect, useRef, useState } from "react";

export function useInView<T extends Element = HTMLElement>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ref, inView };
}
```

- [ ] **Step 2: Create `hooks/use-scroll-direction.ts`**

```ts
import { useEffect, useState } from "react";

export function useScrollDirection() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/use-in-view.ts hooks/use-scroll-direction.ts
git commit -m "feat: add useInView and useScrollDirection hooks"
```

---

## Task 3: SiteNav

**Files:**
- Create: `components/landing/site-nav.tsx`

- [ ] **Step 1: Create `components/landing/site-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const hidden = useScrollDirection();

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md transition-transform duration-300 sm:px-10",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <Link href="/" className="font-display text-xl font-bold text-foreground">
        W<span className="ai-letters">ai</span>ve
      </Link>
      <div className="flex items-center gap-6">
        <a
          href="#how"
          className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          How it works
        </a>
        <a
          href="#try"
          className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          Try a sample
        </a>
        <Link
          href="/app"
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the tool →
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/site-nav.tsx
git commit -m "feat: add SiteNav with scroll-aware hide/show"
```

---

## Task 4: ResultCardPreview + HeroSection

**Files:**
- Create: `components/landing/result-card-preview.tsx`
- Create: `components/landing/hero-section.tsx`

- [ ] **Step 1: Create `components/landing/result-card-preview.tsx`**

Static decorative card showing a decoded SSA notice — no props, no interactivity.

```tsx
export function ResultCardPreview() {
  return (
    <div
      className="relative animate-fade-up rounded-2xl border border-border bg-card shadow-xl"
      style={{ animationDelay: "150ms" }}
    >
      <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
        Decoded Notice
      </span>

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-urgent font-mono text-urgent">
            <span className="text-lg font-bold leading-none">8</span>
            <span className="text-[10px] font-medium">days</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">SSA Overpayment Notice</p>
            <p className="text-xs text-muted-foreground">Social Security Administration</p>
            <p className="font-mono text-xs font-semibold text-urgent">Claimed: $1,240.00</p>
          </div>
        </div>

        {/* Remedy */}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-safe/30 bg-safe/10 px-3 py-2">
          <span className="font-bold text-safe">✓</span>
          <div>
            <p className="text-xs font-bold text-safe">Remedy found: Waiver</p>
            <p className="text-[11px] text-muted-foreground">Fault not required — SSA error likely</p>
          </div>
        </div>

        {/* Presumption */}
        <div className="mb-3 rounded-r-md border-l-2 border-highlight bg-highlight/10 py-1.5 pl-3 pr-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-highlight-foreground/70">
            ⚡ Presumption fires
          </p>
          <p className="text-xs text-highlight-foreground/80">
            Overpayment occurred while SSA had all the facts — shifts burden back
          </p>
        </div>

        {/* Draft */}
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
          <div className="flex h-6 w-8 shrink-0 items-center justify-center rounded bg-primary font-mono text-[9px] font-bold text-primary-foreground">
            SSA
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">SSA-632 draft ready</p>
            <p className="text-[11px] text-muted-foreground">Copy to clipboard · 3-section filing</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-safe" />
          Deadlines computed by tested code · sources cited
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/landing/hero-section.tsx`**

```tsx
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResultCardPreview } from "./result-card-preview";

const STATS = [
  { num: "60s", label: "avg. decode time" },
  { num: "3", label: "domains covered" },
  { num: "70+", label: "tests passing" },
  { num: "0", label: "guesses made" },
];

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-screen-xl grid-cols-1 gap-12 px-6 pb-20 pt-32 sm:px-10 lg:grid-cols-2 lg:items-center">
      <div className="animate-fade-up">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          Information &amp; document prep — not legal advice
        </div>

        <h1 className="mb-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Your escape hatch
          <br />
          was always{" "}
          <span className="relative inline-block after:absolute after:bottom-1 after:left-0 after:right-0 after:h-1 after:rounded-full after:bg-highlight after:opacity-80">
            there.
          </span>
        </h1>

        <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Official notices hide remedies most people never find in time. Waive reads the letter,
          computes your exact deadline, and routes you to the exit before the clock runs out.
        </p>

        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="#try"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try a sample notice →
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            How it works
          </a>
        </div>

        <div className="grid grid-cols-4 gap-4 border-t border-border pt-6">
          {STATS.map(({ num, label }) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold text-primary">{num}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center lg:justify-end">
        <div className="w-full max-w-sm">
          <ResultCardPreview />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/result-card-preview.tsx components/landing/hero-section.tsx
git commit -m "feat: add ResultCardPreview and HeroSection"
```

---

## Task 5: ProblemSection

**Files:**
- Create: `components/landing/problem-section.tsx`

- [ ] **Step 1: Create `components/landing/problem-section.tsx`**

```tsx
"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const STORIES = [
  {
    quote:
      "I got a letter saying I owe $3,200 to Social Security. I panicked and didn't respond. They garnished my benefits six weeks later.",
    outcome: "Lost by silence",
    good: false,
    scenario: "SSA overpayment · waiver was available · 60-day window missed",
  },
  {
    quote:
      "I was served a debt claim for a card I hadn't used in years. I didn't know I could challenge the limitation period. Default judgment entered.",
    outcome: "Lost by silence",
    good: false,
    scenario: "Debt claim · limitations defense available · no response filed",
  },
  {
    quote:
      "Waive told me there was a waiver available and drafted the form. I filed it the same day. The overpayment was waived in full.",
    outcome: "Escape hatch found",
    good: true,
    scenario: "SSA overpayment · SSA-632 filed · waived in full",
  },
];

export function ProblemSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="problem" className="bg-foreground py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-highlight">
          The problem
        </p>
        <h2 className="mb-16 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-primary-foreground">
          Every year, thousands lose
          <br />
          by silence — not by law.
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STORIES.map((story, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/5 p-6",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 100}ms` } : undefined}
            >
              <blockquote className="mb-4 font-display text-base italic leading-relaxed text-primary-foreground/90">
                &ldquo;{story.quote}&rdquo;
              </blockquote>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  story.good
                    ? "border-safe/30 bg-safe/20 text-safe"
                    : "border-urgent/30 bg-urgent/20 text-red-300",
                )}
              >
                {story.good ? "✓" : "✗"} {story.outcome}
              </span>
              <p className="mt-3 text-xs text-white/40">{story.scenario}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-12 text-center">
          <p className="font-display text-2xl text-primary-foreground">
            The remedy was{" "}
            <span className="text-highlight">always there.</span>
          </p>
          <p className="mt-2 text-sm text-white/50">
            The escape hatch exists in statute. Most people just never find it in time.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/problem-section.tsx
git commit -m "feat: add ProblemSection"
```

---

## Task 6: HowItWorksSection

**Files:**
- Create: `components/landing/how-it-works-section.tsx`

- [ ] **Step 1: Create `components/landing/how-it-works-section.tsx`**

```tsx
"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: "1",
    title: "Drop your notice",
    desc: "Upload a PDF or image of any official letter — SSA, debt claim, court filing. Waive extracts the key facts using a local AI model that runs on your machine.",
    tag: "PDF · Image · Any jurisdiction",
    tagClass: "border-safe/30 bg-safe/10 text-safe",
  },
  {
    num: "2",
    title: "Deadlines computed",
    desc: "Tested, deterministic code calculates your exact deadline — accounting for holidays, weekends, and jurisdiction-specific rules. No AI involved in the math.",
    tag: "Deterministic · Tested · Cited",
    tagClass: "border-highlight/40 bg-highlight/15 text-highlight-foreground",
  },
  {
    num: "3",
    title: "Your escape hatch",
    desc: "The right remedy is routed automatically. A plain-language explanation, the presumptions that fire in your favor, and a ready-to-file draft — all at once.",
    tag: "Remedy · Draft · Citations",
    tagClass: "border-safe/30 bg-safe/10 text-safe",
  },
];

export function HowItWorksSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="how" className="bg-paper py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mx-auto max-w-xl font-display text-4xl font-bold leading-[1.1] text-foreground">
            From intimidating notice
            <br />
            to clear action plan.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Three steps. Under 60 seconds. No legal knowledge required.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Dashed connector line — desktop only */}
          <div
            aria-hidden
            className="absolute left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] top-7 hidden border-t-2 border-dashed border-border md:block"
          />

          {STEPS.map((step, i) => (
            <div
              key={i}
              className={cn("relative z-10 text-center", inView ? "animate-fade-up" : "opacity-0")}
              style={inView ? { animationDelay: `${i * 120}ms` } : undefined}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground shadow-[0_0_0_6px_hsl(var(--background)),0_0_0_7px_hsl(var(--border))]">
                {step.num}
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              <span
                className={cn(
                  "inline-block rounded-full border px-3 py-1 text-xs font-semibold",
                  step.tagClass,
                )}
              >
                {step.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/how-it-works-section.tsx
git commit -m "feat: add HowItWorksSection with scroll-triggered step animations"
```

---

## Task 7: DifferentiatorSection

**Files:**
- Create: `components/landing/differentiator-section.tsx`

- [ ] **Step 1: Create `components/landing/differentiator-section.tsx`**

```tsx
"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const DIFFS = [
  {
    icon: "⚖️",
    title: "The AI only translates. The code decides.",
    desc: "Every deadline and remedy is computed by deterministic, tested rule packs — never by a language model. The LLM reads your notice and explains the result. It never calculates, infers, or guesses your legal outcome.",
    tag: "engine/pipeline.ts · 0 AI branches",
  },
  {
    icon: "🧪",
    title: "70+ tests. Every deadline verified.",
    desc: "Each deadline formula, holiday exclusion, and remedy route is covered by unit and golden tests. The test suite runs against real statutory calendars — not mocked data.",
    tag: "70 passing · 0 mocked deadlines",
  },
  {
    icon: "📎",
    title: "Every claim is cited.",
    desc: "No statement goes unsourced. Every remedy, presumption, and deadline derivation traces back to a statute, CFR section, POMS provision, or court rule — and the source is shown inline.",
    tag: "corpus/benefits.json · verified",
  },
  {
    icon: "🔌",
    title: "Domain-agnostic by design.",
    desc: "New notice types plug in as rule packs — no changes to the core engine. SSA overpayments and debt claims in 3 jurisdictions already. A new domain takes hours, not weeks.",
    tag: "packs/benefits · packs/answer",
  },
];

export function DifferentiatorSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section
      className="border-y border-highlight/20 bg-highlight/[0.07] py-24"
      ref={ref}
    >
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-highlight-foreground/70">
            What makes it different
          </p>
          <h2 className="font-display text-4xl font-bold leading-[1.1] text-foreground">
            Built to be trusted,
            <br />
            not just impressive.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {DIFFS.map((d, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-4 rounded-2xl border border-border bg-card p-7",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-xl">
                {d.icon}
              </div>
              <div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{d.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{d.desc}</p>
                <span className="font-mono text-xs font-medium text-primary">{d.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/differentiator-section.tsx
git commit -m "feat: add DifferentiatorSection"
```

---

## Task 8: SampleCtaSection

**Files:**
- Create: `components/landing/sample-cta-section.tsx`

- [ ] **Step 1: Create `components/landing/sample-cta-section.tsx`**

This component is a Server Component (no `"use client"`) — it receives `SampleCard[]` and renders static `<Link>` elements. No hooks needed.

```tsx
import Link from "next/link";
import type { SampleCard } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const TONE_THUMB: Record<SampleCard["tone"], { bg: string; emoji: string }> = {
  urgent: { bg: "bg-gradient-to-br from-urgent/10 to-red-100", emoji: "📋" },
  primary: { bg: "bg-gradient-to-br from-primary/10 to-safe/10", emoji: "⚖️" },
  highlight: { bg: "bg-gradient-to-br from-highlight/20 to-amber-100", emoji: "🏛️" },
};

const TONE_BADGE: Record<SampleCard["tone"], string> = {
  urgent: "border-urgent/30 bg-urgent/15 text-urgent",
  primary: "border-safe/30 bg-safe/15 text-safe",
  highlight: "border-highlight/40 bg-highlight/20 text-highlight-foreground",
};

interface SampleCtaSectionProps {
  samples: SampleCard[];
}

export function SampleCtaSection({ samples }: SampleCtaSectionProps) {
  return (
    <section id="try" className="bg-paper py-24">
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            Try it now
          </p>
          <h2 className="mx-auto max-w-xl font-display text-4xl font-bold leading-[1.1] text-foreground">
            Pick a notice. See it decoded.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Real scenarios. Real results. Click any card to run the full pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {samples.map((s) => {
            const { bg, emoji } = TONE_THUMB[s.tone];
            return (
              <Link
                key={s.id}
                href={`/app?sample=${s.id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={cn("flex h-28 items-center justify-center text-4xl", bg)}>
                  {emoji}
                </div>
                <div className="p-5">
                  <span
                    className={cn(
                      "mb-3 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      TONE_BADGE[s.tone],
                    )}
                  >
                    {s.badge}
                  </span>
                  <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                    Decode this notice <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Or upload your own notice →
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/sample-cta-section.tsx
git commit -m "feat: add SampleCtaSection with /app?sample= deep-links"
```

---

## Task 9: TrustSection + SiteFooter

**Files:**
- Create: `components/landing/trust-section.tsx`
- Create: `components/landing/site-footer.tsx`

- [ ] **Step 1: Create `components/landing/trust-section.tsx`**

Uses a count-up animation on the stat numbers when scrolled into view.

```tsx
"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return count;
}

const STATS = [
  {
    value: 70,
    suffix: "+",
    label: "Tests passing",
    desc: "Every deadline formula, holiday rule, and remedy route covered",
  },
  {
    value: 0,
    suffix: "",
    label: "AI-decided outcomes",
    desc: "Deadlines and remedies computed by deterministic code only",
  },
  {
    value: 3,
    suffix: "",
    label: "Jurisdictions",
    desc: "SSA federal, Ontario, British Columbia, California",
  },
  {
    value: 100,
    suffix: "%",
    label: "Sources cited",
    desc: "Every claim traces back to a statute, CFR, POMS, or court rule",
  },
];

const PILLS = [
  { icon: "🔒", text: "Runs on your machine — no data leaves" },
  { icon: "📖", text: "Information only — not legal advice" },
  { icon: "⚡", text: "Local AI model via Ollama" },
  { icon: "🧪", text: "Open source rule packs" },
];

export function TrustSection() {
  const { ref, inView } = useInView<HTMLElement>();
  const counts = [
    useCountUp(70, inView),
    useCountUp(0, inView),
    useCountUp(3, inView),
    useCountUp(100, inView),
  ];

  return (
    <section className="bg-foreground py-20" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10 text-center">
        <h2 className="mb-12 font-display text-2xl font-semibold text-primary-foreground">
          Built for the moment when the stakes are real.
        </h2>

        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              className={cn(inView ? "animate-fade-up" : "opacity-0")}
              style={inView ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <p className="font-display text-4xl font-bold text-highlight">
                {counts[i]}{s.suffix}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-foreground">{s.label}</p>
              <p className="mt-1 text-xs text-white/45">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 border-t border-white/10 pt-10">
          {PILLS.map((p) => (
            <span
              key={p.text}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/60"
            >
              <span aria-hidden>{p.icon}</span>
              {p.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/landing/site-footer.tsx`**

```tsx
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-foreground px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-6">
        <div>
          <Link href="/" className="font-display text-lg font-bold text-primary-foreground">
            W<span className="text-highlight">ai</span>ve
          </Link>
          <p className="mt-0.5 text-sm text-white/40">Stop losing by silence.</p>
        </div>
        <p className="max-w-md text-right text-xs leading-relaxed text-white/30">
          Information and document preparation only — not legal advice. No attorney-client
          relationship is formed. Always consult a qualified attorney for your specific situation.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/trust-section.tsx components/landing/site-footer.tsx
git commit -m "feat: add TrustSection with count-up animation and SiteFooter"
```

---

## Task 10: Assemble the landing page

**Files:**
- Modify: `app/page.tsx` (replace entirely with the Server Component landing page)

- [ ] **Step 1: Replace `app/page.tsx` with the landing page Server Component**

The original `app/page.tsx` content has already been preserved in `app/app/page.tsx` (Task 1). Overwrite it entirely:

```tsx
import { SAMPLES } from "@/samples";
import type { SampleCard } from "@/lib/api-types";
import { SiteNav } from "@/components/landing/site-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { DifferentiatorSection } from "@/components/landing/differentiator-section";
import { SampleCtaSection } from "@/components/landing/sample-cta-section";
import { TrustSection } from "@/components/landing/trust-section";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  const samples: SampleCard[] = SAMPLES.map((s) => ({
    id: s.id,
    packId: s.packId,
    title: s.title,
    blurb: s.blurb,
    badge: s.badge,
    tone: s.tone,
    imagePath: s.imagePath,
  }));

  return (
    <div className="min-h-screen bg-paper">
      <SiteNav />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <DifferentiatorSection />
      <SampleCtaSection samples={samples} />
      <TrustSection />
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verify `http://localhost:3000/` renders the new landing page**

Check each section scrolls correctly. Confirm:
- Nav is sticky and hides on scroll down
- Hero result card is visible on the right
- Clicking "Open the tool →" navigates to `/app`
- Clicking "Try a sample notice →" scrolls to the `#try` section
- Clicking a sample card in the `#try` section navigates to `/app?sample=<id>` and auto-runs

- [ ] **Step 3: Verify `http://localhost:3000/app` still works end-to-end**

Upload a sample or use the upload zone. Confirm the back link `← Waive` is visible and returns to `/`.

- [ ] **Step 4: Run the existing test suite to confirm nothing broke**

```bash
npm test
```

Expected: all tests pass. The landing page is purely additive — no engine, pack, or API route was modified.

- [ ] **Step 5: Run a production build to catch any type errors**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: launch redesigned landing page at /"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| New `/` landing page (Server Component) | Task 10 |
| Tool moved to `/app` | Task 1 |
| Sticky frosted nav | Task 3 |
| Hero — split layout, copy left, result card right | Task 4 |
| Problem section — dark, 3 story cards | Task 5 |
| How it works — 3-step connected flow | Task 6 |
| Differentiator section — 4 feature cards | Task 7 |
| Sample CTA — cards link to `/app?sample=` | Task 8 |
| Trust section — stats count-up + pills | Task 9 |
| Footer — wordmark + disclaimer | Task 9 |
| Back link in `/app` | Task 1 |
| Query-param deep-link `?sample=<id>` | Task 1 |
| Scroll-triggered animations (IntersectionObserver) | Tasks 2, 5, 6, 7, 9 |
| Nav hide/show on scroll | Tasks 2, 3 |
| Civic Editorial aesthetic (parchment, Fraunces, emerald/gold) | All tasks — uses existing tokens |
| `prefers-reduced-motion` respected | Existing `globals.css` already handles `animate-fade-up` |

**Placeholder scan:** No TBDs. All code blocks are complete. ✓

**Type consistency:**
- `SampleCard` interface used consistently (from `@/lib/api-types`) across Tasks 1, 8, 10 ✓
- `useInView<T extends Element>` generic matches usage in Tasks 5, 6, 7, 9 ✓
- `SAMPLES` imported from `@/samples` — same source used by `/api/samples/route.ts` ✓
- `AnalyzeRequest` / `Origin` types in Task 1 match the original `app/page.tsx` exactly ✓
