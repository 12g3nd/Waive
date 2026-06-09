"use client";

import { useState } from "react";
import { MessagesSquare, Send, Loader2 } from "lucide-react";
import type { ResolvedCitation } from "@/engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CitationChip } from "@/components/citation-chip";
import { cn } from "@/lib/utils";

interface AskPanelProps {
  domain: string;
  language: string;
  grounding: string;
  suggestions: string[];
}

interface AskResponse {
  ok: boolean;
  answer?: string;
  source?: "llm" | "retrieval";
  citations?: ResolvedCitation[];
  error?: string;
}

export function AskPanel({ domain, language, grounding, suggestions }: AskPanelProps) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<"llm" | "retrieval" | null>(null);
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
        body: JSON.stringify({ domain, language, grounding, question: text }),
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
        Answers come only from the verified sources on this page — never invented.
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

      {!answer && (
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

      {answer && (
        <div className="space-y-2 rounded-xl border border-border bg-secondary/25 p-3.5">
          <div className="flex items-center justify-between">
            <Badge variant={source === "llm" ? "primary" : "outline"}>
              {source === "llm" ? "local model · grounded" : "from your sources"}
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
