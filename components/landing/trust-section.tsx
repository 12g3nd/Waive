"use client";

import { useEffect, useState } from "react";
import { Lock, BookOpen, Cpu, FlaskConical } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    // Respect reduced-motion: skip the animation and show the final number.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setCount(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return count;
}

const STATS = [
  {
    value: 70,
    suffix: "+",
    label: "Tests passing",
    desc: "Every deadline formula, holiday rule, and remedy route verified",
  },
  {
    value: 0,
    suffix: "",
    label: "AI-decided outcomes",
    desc: "Deadlines and remedies are always computed by code, never guessed",
  },
  {
    value: 4,
    suffix: "",
    label: "Jurisdictions",
    desc: "SSA federal, Ontario, British Columbia, California",
  },
  {
    value: 100,
    suffix: "%",
    label: "Sources cited",
    desc: "Every claim traces back to a real statute or court rule",
  },
] as const;

const PILLS = [
  { icon: Lock, text: "Never sent to a paid cloud AI service" },
  { icon: BookOpen, text: "Information only, not legal advice" },
  { icon: Cpu, text: "Works offline with a local AI model" },
  { icon: FlaskConical, text: "Open source, see exactly how it works" },
];

export function TrustSection() {
  const { ref, inView } = useInView<HTMLElement>();
  // Derived from STATS so the animated number can never drift from its label.
  const counts = [
    useCountUp(STATS[0].value, inView),
    useCountUp(STATS[1].value, inView),
    useCountUp(STATS[2].value, inView),
    useCountUp(STATS[3].value, inView),
  ];

  return (
    <section className="bg-ink py-20" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 text-center sm:px-10">
        <h2 className="mb-14 font-display text-2xl font-medium text-primary-foreground sm:text-3xl">
          Numbers that matter <em className="italic text-highlight">when it counts.</em>
        </h2>

        <div className="mb-14 grid grid-cols-2 divide-white/10 sm:grid-cols-4 sm:divide-x">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn("px-4 py-3", inView ? "animate-fade-up" : "opacity-0")}
              style={inView ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <p className="font-display text-5xl font-semibold tabular-nums text-highlight">
                {counts[i]}
                {s.suffix}
              </p>
              <p className="mt-2 text-sm font-semibold text-primary-foreground">{s.label}</p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-white/45">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 border-t border-white/10 pt-10">
          {PILLS.map((p) => (
            <span
              key={p.text}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/60"
            >
              <p.icon className="size-3.5 text-white/40" aria-hidden />
              {p.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
