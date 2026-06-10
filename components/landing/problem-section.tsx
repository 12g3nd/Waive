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
    file: "CASE 01",
  },
  {
    quote:
      "I was served a debt claim for a card I hadn't used in years. I didn't know I could challenge the limitation period. Default judgment entered.",
    outcome: "Lost by silence",
    good: false,
    scenario: "Debt claim · limitations defense available · no response filed",
    file: "CASE 02",
  },
  {
    quote:
      "Waive told me there was a waiver available and drafted the form. I filed it the same day. The overpayment was waived in full.",
    outcome: "Escape hatch found",
    good: true,
    scenario: "SSA overpayment · SSA-632 filed · waived in full",
    file: "CASE 03",
  },
];

export function ProblemSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="problem" className="bg-ink py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <p className="eyebrow mb-5 text-highlight">The problem</p>
        <h2 className="mb-16 max-w-2xl font-display text-4xl font-semibold leading-[1.1] text-primary-foreground sm:text-5xl">
          Real people. Real letters.
          <br />
          Real consequences for <em className="italic text-highlight">not knowing.</em>
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STORIES.map((story, i) => (
            <article
              key={i}
              className={cn(
                "relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 100}ms` } : undefined}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-white/35">
                  {story.file}
                </span>
                <span aria-hidden className="font-display text-5xl italic leading-none text-white/15">
                  &ldquo;
                </span>
              </div>
              <blockquote className="mb-6 flex-1 font-display text-base italic leading-relaxed text-primary-foreground/90">
                {story.quote}
              </blockquote>
              <div>
                <span
                  className={cn("stamp", story.good ? "text-emerald-300" : "text-red-300/90")}
                >
                  {story.outcome}
                </span>
                <p className="mt-4 border-t border-white/10 pt-3 font-mono text-[11px] leading-relaxed text-white/40">
                  {story.scenario}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-12 text-center">
          <p className="font-display text-2xl text-primary-foreground sm:text-3xl">
            The law gave you a way out.{" "}
            <em className="italic text-highlight">Most people never find it.</em>
          </p>
          <p className="mt-3 text-sm text-white/50">
            Waive exists for the moment you get that letter and don&apos;t know what to do next.
          </p>
        </div>
      </div>
    </section>
  );
}
