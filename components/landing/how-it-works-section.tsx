"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: "1",
    title: "Upload your letter",
    desc: "Take a photo or upload a PDF of the notice you received. It stays on your device and nothing is sent to a server.",
    tag: "PDF · Photo · Any jurisdiction",
    tagClass: "border-safe/30 bg-safe/10 text-safe",
  },
  {
    num: "2",
    title: "We find your deadline",
    desc: "Waive calculates exactly how many days you have left, accounting for weekends, holidays, and your jurisdiction's rules. No guessing.",
    tag: "Always calculated by code",
    tagClass: "border-highlight/40 bg-highlight/15 text-highlight-foreground",
  },
  {
    num: "3",
    title: "You get a clear path forward",
    desc: "We show you what options you have, what to do next, and give you a ready-to-file draft if one applies. Plain English, every time.",
    tag: "Remedy · Draft · Citations",
    tagClass: "border-safe/30 bg-safe/10 text-safe",
  },
];

export function HowItWorksSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="how" className="bg-paper py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mx-auto max-w-xl font-display text-4xl font-bold leading-[1.1] text-foreground">
            Three steps.
<br />
            From confused to confident.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Three steps. Under 60 seconds. No legal knowledge required.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Dashed connector line — desktop only */}
          <div
            aria-hidden
            className="absolute left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] top-7 hidden border-t-2 border-dashed border-border md:block"
          />

          {STEPS.map((step, i) => (
            <div
              key={i}
              className={cn("relative z-10 text-center", inView ? "animate-fade-up" : "opacity-0")}
              style={inView ? { animationDelay: `${i * 120}ms` } : undefined}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground shadow-[0_0_0_6px_hsl(var(--background)),0_0_0_7px_hsl(var(--border))]">
                {step.num}
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              <span
                className={cn(
                  "inline-block rounded-full border px-3 py-1 text-xs font-semibold",
                  step.tagClass,
                )}
              >
                {step.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
