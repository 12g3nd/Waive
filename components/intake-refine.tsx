"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { IntakeQuestion, UserFacts } from "@/engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnswerValue = string | number | boolean;

interface IntakeRefineProps {
  questions: IntakeQuestion[];
  initial?: Record<string, AnswerValue>;
  onSubmit: (facts: UserFacts) => void;
  busy?: boolean;
}

/** Compact intake so an uploaded notice can be sharpened into the right remedy. */
export function IntakeRefine({ questions, initial = {}, onSubmit, busy }: IntakeRefineProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initial);

  function set(id: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-primary" />
        <h3 className="font-display text-base font-semibold">Sharpen your answer</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        A few quick questions route you to the right form. Skip any you’re unsure of.
      </p>

      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="space-y-1.5">
            <label className="block text-sm font-medium" htmlFor={`q-${q.id}`}>
              {q.prompt}
            </label>
            {q.help && <p className="text-xs text-muted-foreground">{q.help}</p>}

            {q.type === "boolean" ? (
              <div className="inline-flex overflow-hidden rounded-full border border-border">
                {[
                  { v: true, label: "Yes" },
                  { v: false, label: "No" },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => set(q.id, opt.v)}
                    aria-pressed={answers[q.id] === opt.v}
                    className={cn(
                      "px-4 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      answers[q.id] === opt.v
                        ? "bg-foreground text-background"
                        : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : q.type === "single" && q.options ? (
              <select
                id={`q-${q.id}`}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={String(answers[q.id] ?? "")}
                onChange={(e) => set(q.id, e.target.value)}
              >
                <option value="">—</option>
                {q.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`q-${q.id}`}
                type={q.type === "currency" || q.type === "number" ? "number" : q.type === "date" ? "date" : "text"}
                inputMode={q.type === "currency" || q.type === "number" ? "decimal" : undefined}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                placeholder={q.type === "currency" ? "$ amount" : ""}
                value={String(answers[q.id] ?? "")}
                onChange={(e) =>
                  set(
                    q.id,
                    q.type === "currency" || q.type === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
          </div>
        ))}
      </div>

      <Button variant="primary" className="w-full" disabled={busy} onClick={() => onSubmit({ answers })}>
        Update my plan
      </Button>
    </div>
  );
}
