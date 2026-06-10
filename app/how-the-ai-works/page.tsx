import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Languages,
  MessagesSquare,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "How Waive uses AI",
  description:
    "An honest, complete account of how AI is used in Waive — as a bounded translator, never as the decision-maker.",
};

const PRODUCT_JOBS = [
  {
    icon: ScanLine,
    title: "Reads the notice",
    body: "A local vision model turns the uploaded letter into structured fields — issuer, dates, amounts, case numbers. It extracts; it never concludes.",
    file: "lib/llm/extraction.ts",
  },
  {
    icon: Languages,
    title: "Explains & translates",
    body: "The deterministic result is built first. The model is only allowed to rephrase it in plain language, or in another language (EN/ES). It cannot add or change a legal claim, deadline, or amount.",
    file: "lib/llm/client.ts",
  },
  {
    icon: MessagesSquare,
    title: "Answers your questions",
    body: "“Ask about your notice” answers are grounded strictly in the verified citation corpus — never free-form legal advice invented on the spot.",
    file: "lib/qa.ts",
  },
];

export default function HowTheAiWorksPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Slim top bar with the brand hairline, matching the tool view. */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div aria-hidden className="h-0.5 bg-highlight" />
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 sm:px-8">
          <Link href="/" className="group inline-flex items-center gap-1.5" aria-label="Waive — home">
            <ArrowLeft className="size-3.5 text-muted-foreground" />
            <Wordmark className="text-lg" />
          </Link>
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
          >
            Open the tool
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
        <p className="eyebrow mb-5 text-primary">Transparency</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          How Waive uses AI
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          STEMINATE Hacks asks teams to disclose significant use of AI. Here is a complete, honest
          account — what the AI does in Waive, how the project was built, and the lines the model is
          never allowed to cross.
        </p>

        {/* The core principle, stated plainly. */}
        <section className="mt-10 rounded-2xl border-2 border-primary/25 bg-primary/[0.06] p-7">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            AI reads. Code decides.
          </h2>
          <p className="mt-3 leading-relaxed text-foreground/80">
            The high-stakes outputs — your deadline, the remedy you’re routed to, and whether you
            automatically qualify for a strong escape hatch — are computed by tested, deterministic
            code that shows its work. A model never decides any of them. The AI’s only job is to
            read your letter and rephrase the result so it’s understandable.
          </p>
        </section>

        {/* In the product. */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            In the product — three bounded jobs
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PRODUCT_JOBS.map((job) => (
              <article key={job.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <job.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {job.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.body}</p>
                <code className="mt-4 inline-block rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-[0.7rem] text-foreground/70">
                  {job.file}
                </code>
              </article>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-5">
            <Cpu className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-relaxed text-foreground/80">
              The model runs <strong>locally via Ollama — no paid cloud API.</strong> If it’s
              unavailable, every feature degrades gracefully to deterministic, citation-grounded
              behavior, so the demo runs fully offline. The model is optional by design: your
              deadline never depended on it.
            </p>
          </div>
        </section>

        {/* Build-time disclosure. */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Built with an AI coding assistant
          </h2>
          <p className="mt-3 leading-relaxed text-foreground/80">
            This project was built during the hackathon window with significant help from an AI
            coding assistant (Anthropic’s Claude / Claude Code), under our direction. No pre-existing
            codebase was used — the repository was created from empty and developed across the event.
          </p>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="font-semibold text-foreground">What the assistant did</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                Scaffolding, most of the implementation code, the unit and golden tests, the UI
                components, and documentation drafts — guided by our specification and decisions.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">What we directed and own</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                The product concept and architecture (a domain-blind engine + pluggable rule packs);
                the hard constraints (run on a local model, no paid cloud API; the jurisdictions we
                ship); the non-negotiable design principles (deterministic legal logic, the AI as a
                bounded translator, verified-citations-only, integrity over engagement); and the
                legal-source verification.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">We can explain it</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                On request we can walk through why the high-stakes logic is deterministic, how each
                deadline is computed (pure, golden-tested date math), how the system is prevented
                from hallucinating law (a rule → corpus-id mapping, never the model), and how a new
                injustice is added (implement the <code className="font-mono text-[0.85em]">RulePack</code>{" "}
                interface; the engine doesn’t change).
              </dd>
            </div>
          </dl>
        </section>

        {/* Integrity. */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Legal-content integrity
          </h2>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-6">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="leading-relaxed text-foreground/80">
              Every legal claim shown is mapped to a curated citation corpus and verified against
              official sources (ssa.gov, 20 CFR via Cornell LII, SSA EM-25029 REV, and the Ontario,
              British Columbia, and California statutes and court rules). There are{" "}
              <strong>no fabricated citations</strong>; the corpus contains{" "}
              <strong>zero placeholder citations</strong>, and a test enforces it. Waive is
              positioned throughout as <strong>information and document preparation, not legal
              advice.</strong>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
