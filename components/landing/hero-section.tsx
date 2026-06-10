import Link from "next/link";
import { ArrowRight, Gavel, Mail, ShieldCheck } from "lucide-react";
import { ResultCardPreview } from "./result-card-preview";
import { OriginalNoticePreview } from "./original-notice-preview";

const STATS = [
  { num: "60s", label: "avg. read time" },
  { num: "5", label: "jurisdictions, more to come" },
  { num: "100%", label: "answers with a source" },
  { num: "0", label: "guesses made" },
];

const WHO_ITS_FOR = [
  { icon: Mail, label: "Got an SSA overpayment notice" },
  { icon: Gavel, label: "Served a debt lawsuit" },
];

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-screen-xl grid-cols-1 gap-12 px-6 pb-24 pt-32 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
      <div className="animate-fade-up">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <ShieldCheck className="size-3.5 text-primary" />
          Help with information and forms, not legal advice
        </div>

        <h1 className="mb-6 font-display text-[2.75rem] font-semibold leading-[1.06] tracking-tight text-foreground sm:text-6xl">
          You don&apos;t need a lawyer
          <br />
          to understand{" "}
          <em className="relative inline-block font-bold italic">
            your rights.
            {/* Hand-drawn underline stroke */}
            <svg
              aria-hidden
              viewBox="0 0 120 12"
              preserveAspectRatio="none"
              className="absolute -bottom-1.5 left-0 h-3 w-full text-highlight"
            >
              <path
                d="M3 8.5C25 5 55 4 117 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </em>
        </h1>

<blockquote className="mb-6 max-w-lg border-l-2 border-primary pl-4">
          <p className="font-display text-[0.95rem] italic leading-relaxed text-muted-foreground">
            Illustrative: a $9,400 SSA overpayment, decoded in 60 seconds. Waiver path found,
            Form SSA-632 drafted, 24 days still on the clock.
          </p>
          <footer className="mt-1.5 font-mono text-[11px] font-medium tracking-wide text-foreground/70">
            example outcome, not a real client
          </footer>
        </blockquote>
        <p className="mb-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Official notices hide remedies most people never find in time. Waive reads your letter,
          finds your deadline, and shows you the way out, in under 60 seconds.
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {WHO_ITS_FOR.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80"
            >
              <Icon className="size-3.5 text-primary" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <div className="mb-12 flex flex-wrap items-center gap-3">
          <Link
            href="#try"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
          >
            Try a sample notice
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-card"
          >
            How it works
          </a>
        </div>

        {/* Ledger row: tabular figures over small-caps labels, ruled like a form. */}
        <dl className="grid max-w-xl grid-cols-2 border-t border-foreground/15 sm:grid-cols-4">
          {STATS.map(({ num, label }, i) => (
            <div
              key={label}
              className={
                "py-4 pr-4 " + (i > 0 ? "sm:border-l sm:border-foreground/10 sm:pl-4" : "")
              }
            >
              <dd className="font-display text-[1.7rem] font-semibold tabular-nums leading-none text-primary">
                {num}
              </dd>
              <dt className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Before → after: the intimidating notice up top, decoded into a plan below. */}
      <div className="relative flex justify-center lg:justify-end">
        <div className="relative w-full max-w-sm animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* Faint extra sheet for depth behind the "before". */}
          <div
            aria-hidden
            className="absolute -right-3 top-1 hidden h-44 w-[86%] rotate-3 rounded-xl border border-border bg-secondary/50 sm:block"
          />

          {/* The "before": dense, greyed, pushed right and tilted. */}
          <div className="relative ml-auto w-[86%] -rotate-2">
            <OriginalNoticePreview />
          </div>

          {/* The "after" tucks over the bottom of the notice like a sorted page —
              dread (red stamp, struck-through total) becomes a plan (green stamp). */}
          <div className="relative z-10 -mt-8 rotate-1">
            <ResultCardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
