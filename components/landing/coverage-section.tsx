"use client";

import { Landmark, FileText, CalendarClock, Hourglass } from "lucide-react";
import { DEBT_JURISDICTIONS } from "@/packs/answer/jurisdictions";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface CoverageRow {
  icon: typeof Landmark;
  label: string;
  value: string;
}

interface CoverageCard {
  flag: string;
  region: string;
  domain: string;
  rows: CoverageRow[];
}

// The SSA "hero" domain is a federal profile rather than a DebtJurisdiction, so
// it's described by hand; the debt cards are generated straight from the live
// jurisdiction table — the same data the engine runs on.
const SSA_CARD: CoverageCard = {
  flag: "🇺🇸",
  region: "United States — Federal",
  domain: "SSA overpayment",
  rows: [
    { icon: Landmark, label: "Issuer", value: "Social Security Administration" },
    { icon: FileText, label: "Respond with", value: "Form SSA-632 · waiver request" },
    { icon: CalendarClock, label: "Deadline", value: "60-day waiver window" },
    { icon: Hourglass, label: "Key rule", value: "30-day collection hold (EM-25029 REV)" },
  ],
};

const DEBT_CARDS: CoverageCard[] = DEBT_JURISDICTIONS.map((j) => ({
  flag: j.country === "Canada" ? "🇨🇦" : "🇺🇸",
  region: j.region,
  domain: "Debt lawsuit",
  rows: [
    { icon: Landmark, label: "Court", value: j.court },
    {
      icon: FileText,
      label: "Respond with",
      value: j.responseDoc.formNumber
        ? `${j.responseDoc.name} · ${j.responseDoc.formNumber}`
        : j.responseDoc.name,
    },
    {
      icon: CalendarClock,
      label: "Deadline",
      value: `${j.responseDays} days to respond${
        j.servedOutsideDays ? ` (${j.servedOutsideDays} if served out-of-province)` : ""
      }`,
    },
    { icon: Hourglass, label: "Limitation", value: `${j.limitationYears}-year limitation period` },
  ],
}));

const CARDS: CoverageCard[] = [SSA_CARD, ...DEBT_CARDS];

export function CoverageSection() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section id="coverage" className="bg-paper py-24" ref={ref}>
      <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-5 text-primary">Coverage</p>
          <h2 className="font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
            Two injustices, five jurisdictions,
            <br />
            <em className="italic">one engine.</em>
          </h2>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            Each one below is a verified config profile — the court, the form, the deadline, the
            limitation period, and the citations. The engine never changes. These cards are
            rendered straight from the same data the tool runs on.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <article
              key={c.region}
              className={cn(
                "flex flex-col rounded-2xl border border-border bg-card p-6",
                inView ? "animate-fade-up" : "opacity-0",
              )}
              style={inView ? { animationDelay: `${i * 80}ms` } : undefined}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-2xl" aria-hidden>
                  {c.flag}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-primary">
                  {c.domain}
                </span>
              </div>
              <h3 className="mb-4 font-display text-lg font-semibold leading-snug text-foreground">
                {c.region}
              </h3>
              <dl className="space-y-3">
                {c.rows.map((r) => (
                  <div key={r.label} className="flex items-start gap-2.5">
                    <r.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {r.label}
                      </dt>
                      <dd className="text-sm font-medium leading-snug text-foreground/90">
                        {r.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
