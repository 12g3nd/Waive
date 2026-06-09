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
