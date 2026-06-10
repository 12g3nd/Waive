"use client";

import { Scale, FlaskConical, Paperclip, Blocks } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const DIFFS = [
  {
    icon: Scale,
    clause: "§ 1",
    title: "AI reads. Code decides.",
    desc: "Your deadline and your options are always calculated by tested code, never guessed by AI. The AI only reads your letter and explains the result in plain English.",
    tag: "No AI branches in any legal outcome",
  },
  {
    icon: FlaskConical,
    clause: "§ 2",
    title: "Every deadline is verified.",
    desc: "We test every deadline formula against real statutory calendars, including holidays and weekends. If the code says you have 8 days, you have 8 days.",
    tag: "70+ tests, 0 mocked deadlines",
  },
  {
    icon: Paperclip,
    clause: "§ 3",
    title: "Every claim has a source.",
    desc: "Nothing is made up. Every remedy and deadline we show you traces back to a real statute, regulation, or court rule, and we show you the source so you can verify it yourself.",
    tag: "100% cited, no fabricated statutes",
  },
  {
    icon: Blocks,
    clause: "§ 4",
    title: "Built to grow with you.",
    desc: "Waive already covers SSA overpayments and debt lawsuits across 4 jurisdictions. New notice types can be added in hours, not months. Evictions, CRA notices, EI denials are next.",
    tag: "4 jurisdictions, more coming",
  },
];

export function DifferentiatorSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section className="border-y border-highlight/25 bg-highlight/[0.07] py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-14">
          <p className="eyebrow mb-5 text-highlight-foreground/70">What makes it different</p>
          <h2 className="font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
            Built for the moment,
            <br />
            when the stakes are <em className="italic">real.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {DIFFS.map((d, i) => (
            <article
              key={d.clause}
              className={cn(
                "flex gap-5 rounded-2xl border border-border bg-card p-7",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <div className="flex shrink-0 flex-col items-center gap-2">
                <span className="grid size-11 place-items-center rounded-xl bg-foreground text-background">
                  <d.icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-sm italic text-muted-foreground">{d.clause}</span>
              </div>
              <div>
                <h3 className="mb-2 font-display text-lg font-semibold leading-snug text-foreground">
                  {d.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{d.desc}</p>
                <p className="font-mono text-[11px] font-medium tracking-wide text-primary">
                  {d.tag}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
