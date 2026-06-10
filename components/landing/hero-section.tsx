import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResultCardPreview } from "./result-card-preview";

const STATS = [
  { num: "60s", label: "avg. read time" },
  { num: "4", label: "jurisdictions — more to come!" },
  { num: "100%", label: "answers with a source" },
  { num: "0", label: "guesses made" },
];

const WHO_ITS_FOR = [
  { emoji: "📬", label: "Got an SSA overpayment notice" },
  { emoji: "📋", label: "Served a debt lawsuit" },
  { emoji: "🏠", label: "Received an eviction notice" },
];

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-screen-xl grid-cols-1 gap-12 px-6 pb-20 pt-32 sm:px-10 lg:grid-cols-2 lg:items-center">
      <div className="animate-fade-up">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          Help with information and forms, not legal advice
        </div>

        <h1 className="mb-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          You don't need a lawyer to understand
          <br />
          <span className="relative inline-block after:absolute after:bottom-1 after:left-0 after:right-0 after:h-1 after:rounded-full after:bg-highlight after:opacity-80">
            your rights.
          </span>
        </h1>

        <blockquote className="mb-6 border-l-4 border-primary pl-4 text-sm italic text-muted-foreground">
          "Waive told me there was a waiver available and drafted the form. I filed
          it the same day. The overpayment was waived in full."
          <span className="mt-1 block not-italic font-medium text-foreground">
            — SSA overpayment · escape hatch found
          </span>
        </blockquote>

        <p className="mb-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Official notices hide remedies most people never find in time. Waive reads
          your letter, finds your deadline, and shows you the way out — in under 60 seconds.
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {WHO_ITS_FOR.map(({ emoji, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              {emoji} {label}
            </span>
          ))}
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="#try"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try a sample notice →
          </Link>

          <Link
            href="#how"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            How it works
          </Link>
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