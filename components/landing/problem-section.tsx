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
  },
  {
    quote:
      "I was served a debt claim for a card I hadn't used in years. I didn't know I could challenge the limitation period. Default judgment entered.",
    outcome: "Lost by silence",
    good: false,
    scenario: "Debt claim · limitations defense available · no response filed",
  },
  {
    quote:
      "Waive told me there was a waiver available and drafted the form. I filed it the same day. The overpayment was waived in full.",
    outcome: "Escape hatch found",
    good: true,
    scenario: "SSA overpayment · SSA-632 filed · waived in full",
  },
];

export function ProblemSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="problem" className="bg-foreground py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-highlight">
          The problem
        </p>
        <h2 className="mb-16 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-primary-foreground">
          Every year, thousands lose
          <br />
          by silence — not by law.
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STORIES.map((story, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/5 p-6",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 100}ms` } : undefined}
            >
              <blockquote className="mb-4 font-display text-base italic leading-relaxed text-primary-foreground/90">
                &ldquo;{story.quote}&rdquo;
              </blockquote>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  story.good
                    ? "border-safe/30 bg-safe/20 text-safe"
                    : "border-urgent/30 bg-urgent/20 text-red-300",
                )}
              >
                {story.good ? "✓" : "✗"} {story.outcome}
              </span>
              <p className="mt-3 text-xs text-white/40">{story.scenario}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-12 text-center">
          <p className="font-display text-2xl text-primary-foreground">
            The remedy was{" "}
            <span className="text-highlight">always there.</span>
          </p>
          <p className="mt-2 text-sm text-white/50">
            The escape hatch exists in statute. Most people just never find it in time.
          </p>
        </div>
      </div>
    </section>
  );
}
