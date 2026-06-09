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
