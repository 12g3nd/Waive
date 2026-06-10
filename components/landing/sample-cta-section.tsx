import Link from "next/link";
import { ArrowRight, Landmark, Scale, FileWarning, Upload } from "lucide-react";
import type { SampleCard } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const TONE_META: Record<
  SampleCard["tone"],
  { icon: typeof Scale; accent: string; seal: string; badge: string }
> = {
  urgent: {
    icon: FileWarning,
    accent: "bg-urgent/30",
    seal: "border-urgent/40 text-urgent",
    badge: "border-urgent/30 bg-urgent/10 text-urgent",
  },
  primary: {
    icon: Scale,
    accent: "bg-primary/25",
    seal: "border-primary/40 text-primary",
    badge: "border-safe/30 bg-safe/10 text-safe",
  },
  highlight: {
    icon: Landmark,
    accent: "bg-highlight/50",
    seal: "border-highlight-foreground/30 text-highlight-foreground/80",
    badge: "border-highlight/50 bg-highlight/20 text-highlight-foreground",
  },
};

/** Miniature "official notice" drawn in CSS: ruled lines, one highlighted catch, a seal. */
function NoticeThumb({ tone }: { tone: SampleCard["tone"] }) {
  const meta = TONE_META[tone];
  return (
    <div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-border bg-muted/50">
      <div className="relative h-[5.5rem] w-[4.25rem] rounded-[3px] border border-border bg-white p-2 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-1deg]">
        <div className="space-y-1.5">
          <div className="h-1 w-3/5 rounded-full bg-foreground/25" />
          <div className="h-1 w-full rounded-full bg-foreground/10" />
          <div className="h-1 w-5/6 rounded-full bg-foreground/10" />
          <div className={cn("h-1.5 w-4/5 rounded-[2px]", meta.accent)} />
          <div className="h-1 w-full rounded-full bg-foreground/10" />
          <div className="h-1 w-2/3 rounded-full bg-foreground/10" />
        </div>
        <div
          className={cn(
            "absolute -bottom-2 -right-2 grid size-8 rotate-[8deg] place-items-center rounded-full border-2 border-dashed bg-white",
            meta.seal,
          )}
        >
          <meta.icon className="size-3.5" aria-hidden />
        </div>
      </div>
    </div>
  );
}

interface SampleCtaSectionProps {
  samples: SampleCard[];
}

export function SampleCtaSection({ samples }: SampleCtaSectionProps) {
  return (
    <section id="try" className="bg-paper py-24">
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-14 text-center">
          <p className="eyebrow eyebrow-center mb-5 justify-center text-primary">Try it now</p>
          <h2 className="mx-auto max-w-xl font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
            Pick a notice. <em className="italic">See it decoded.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground">
            Real scenarios. Real results. Click any card to run the full pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {samples.map((s) => (
            <Link
              key={s.id}
              href={`/app?sample=${s.id}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(20,20,30,0.35)]"
            >
              <NoticeThumb tone={s.tone} />
              <div className="p-6">
                <span
                  className={cn(
                    "mb-3 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    TONE_META[s.tone].badge,
                  )}
                >
                  {s.badge}
                </span>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Decode this notice
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-card"
          >
            <Upload className="size-4" aria-hidden />
            Or upload your own notice
          </Link>
        </div>
      </div>
    </section>
  );
}
