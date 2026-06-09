"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
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
    desc: "Every deadline formula, holiday rule, and remedy route covered",
  },
  {
    value: 0,
    suffix: "",
    label: "AI-decided outcomes",
    desc: "Deadlines and remedies computed by deterministic code only",
  },
  {
    value: 3,
    suffix: "",
    label: "Jurisdictions",
    desc: "SSA federal, Ontario, British Columbia, California",
  },
  {
    value: 100,
    suffix: "%",
    label: "Sources cited",
    desc: "Every claim traces back to a statute, CFR, POMS, or court rule",
  },
];

const PILLS = [
  { icon: "🔒", text: "Runs on your machine — no data leaves" },
  { icon: "📖", text: "Information only — not legal advice" },
  { icon: "⚡", text: "Local AI model via Ollama" },
  { icon: "🧪", text: "Open source rule packs" },
];

export function TrustSection() {
  const { ref, inView } = useInView<HTMLElement>();
  const counts = [
    useCountUp(70, inView),
    useCountUp(0, inView),
    useCountUp(3, inView),
    useCountUp(100, inView),
  ];

  return (
    <section className="bg-foreground py-20" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10 text-center">
        <h2 className="mb-12 font-display text-2xl font-semibold text-primary-foreground">
          Built for the moment when the stakes are real.
        </h2>

        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              className={cn(inView ? "animate-fade-up" : "opacity-0")}
              style={inView ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <p className="font-display text-4xl font-bold text-highlight">
                {counts[i]}{s.suffix}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-foreground">{s.label}</p>
              <p className="mt-1 text-xs text-white/45">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 border-t border-white/10 pt-10">
          {PILLS.map((p) => (
            <span
              key={p.text}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/60"
            >
              <span aria-hidden>{p.icon}</span>
              {p.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
