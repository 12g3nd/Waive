"use client";

import { FileText, CalendarClock, DoorOpen } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "Upload your letter",
    desc: "Take a photo or upload a PDF of the notice you received. It's read by a local AI model, never sent to a paid third-party cloud service.",
    tag: "PDF · Photo · Any jurisdiction",
  },
  {
    num: "02",
    icon: CalendarClock,
    title: "We find your deadline",
    desc: "Waive calculates exactly how many days you have left, accounting for weekends, holidays, and your jurisdiction's rules. No guessing.",
    tag: "Always calculated by code",
  },
  {
    num: "03",
    icon: DoorOpen,
    title: "You get a clear path forward",
    desc: "We show you what options you have, what to do next, and give you a ready-to-file draft if one applies. Plain English, every time.",
    tag: "Remedy · Draft · Citations",
  },
];

export function HowItWorksSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="how" className="bg-paper py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-16 max-w-2xl">
          <p className="eyebrow mb-5 text-primary">How it works</p>
          <h2 className="font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
            Three steps.
            <br />
            From confused to <em className="italic">confident.</em>
          </h2>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Under 60 seconds. No legal knowledge required.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.num}
              className={cn(
                "relative rounded-2xl border border-border bg-card p-7 pt-6",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 120}ms` } : undefined}
            >
              <div className="mb-6 flex items-start justify-between border-b border-border pb-5">
                <span className="font-display text-5xl font-light italic leading-none text-primary/30">
                  {step.num}
                </span>
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden />
                </span>
              </div>
              <h3 className="mb-3 font-display text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              <p className="font-mono text-[11px] font-medium tracking-wide text-primary">
                {step.tag}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
