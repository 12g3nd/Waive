"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const DIFFS = [
  {
    icon: "⚖️",
    title: "AI reads. Code decides.",
    desc: "Your deadline and your options are always calculated by tested code, never guessed by AI. The AI only reads your letter and explains the result in plain English.",
    tag: "No AI branches in any legal outcome",
  },
  {
    icon: "🧪",
    title: "Every deadline is verified.",
    desc: "We test every deadline formula against real statutory calendars, including holidays and weekends. If the code says you have 8 days, you have 8 days.",
    tag: "70+ tests · 0 mocked deadlines",
  },
  {
    icon: "📎",
    title: "Every claim has a source.",
    desc: "Nothing is made up. Every remedy and deadline we show you traces back to a real statute, regulation, or court rule, and we show you the source so you can verify it yourself.",
    tag: "100% cited · no fabricated statutes",
  },
  {
    icon: "🔌",
    title: "Built to grow with you.",
    desc: "Waive already covers SSA overpayments and debt lawsuits across 4 jurisdictions. New notice types can be added in hours, not months. Evictions, CRA notices, EI denials are next.",
    tag: "4 jurisdictions · more coming",
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
            Built for the moment,
            <br />
            when the stakes are real.
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
