"use client";

import { useState } from "react";
import { MessagesSquare, Send, Loader2 } from "lucide-react";
import type { ResolvedCitation } from "@/engine";
import type { AskSource } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CitationChip } from "@/components/citation-chip";
import { cn } from "@/lib/utils";

interface AskPanelProps {
  domain: string;
  language: string;
  grounding: string;
  /** The case's own citations, so answers ground in jurisdiction-correct rules. */
  caseSources: AskSource[];
  suggestions: string[];
}

type AskAnswerSource = "llm" | "retrieval" | "smalltalk";

interface AskResponse {
  ok: boolean;
  answer?: string;
  source?: AskAnswerSource;
  citations?: ResolvedCitation[];
  error?: string;
}

export function AskPanel({ domain, language, grounding, caseSources, suggestions }: AskPanelProps) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<AskAnswerSource | null>(null);
  const [citations, setCitations] = useState<ResolvedCitation[]>([]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, language, grounding, question: text, caseSources }),
      });
      const data = (await res.json()) as AskResponse;
      setAnswer(data.ok ? (data.answer ?? "") : (data.error ?? "Something went wrong."));
      setSource(data.source ?? null);
      setCitations(data.citations ?? []);
    } catch {
      setAnswer("Couldn’t reach the server. Try again.");
      setSource(null);
      setCitations([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <MessagesSquare className="size-4 text-primary" />
        <h3 className="font-display text-base font-semibold">Ask about your notice</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Answers come only from the verified sources on this page, never invented.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Can this debt be cancelled?"
          aria-label="Ask a question about your notice"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" variant="primary" disabled={busy} aria-label="Ask">
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>

      {/* Suggestions: shown before any answer, and again after a smalltalk reply to
          point the person at real questions. Hidden while an answer is computing. */}
      {(!answer || source === "smalltalk") && !busy && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => {
                setQ(s);
                void ask(s);
              }}
              className={cn(
                "rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Skeleton while the answer is computing — a placeholder shaped like the result. */}
      {busy && (
        <div
          className="space-y-2 rounded-xl border border-border bg-secondary/25 p-3.5"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Finding an answer in your sources…</span>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Reading your sources…
          </div>
          <div className="space-y-1.5 pt-1" aria-hidden>
            <div className="h-3 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-3 w-[94%] animate-pulse rounded bg-foreground/10 [animation-delay:120ms]" />
            <div className="h-3 w-[88%] animate-pulse rounded bg-foreground/10 [animation-delay:240ms]" />
            <div className="h-3 w-[60%] animate-pulse rounded bg-foreground/10 [animation-delay:360ms]" />
          </div>
        </div>
      )}

      {answer && !busy && source === "smalltalk" && (
        <div className="rounded-xl border border-border bg-secondary/25 p-3.5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{answer}</p>
        </div>
      )}

      {answer && !busy && source !== "smalltalk" && (
        <div className="space-y-2 rounded-xl border border-border bg-secondary/25 p-3.5">
          <div className="flex items-center justify-between">
            <Badge variant={source === "llm" ? "primary" : "outline"}>
              {source === "llm" ? "Ollama · grounded" : "from your sources"}
            </Badge>
            <button
              type="button"
              onClick={() => setAnswer(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ask another
            </button>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{answer}</p>
          {citations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {citations.map((c) => (
                <CitationChip key={c.id} id={c.id} citations={citations} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
