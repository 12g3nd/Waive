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
