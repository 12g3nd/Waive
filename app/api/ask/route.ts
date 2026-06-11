import { NextResponse } from "next/server";
import { ollamaAvailable, ollamaChat, readLlmConfig } from "@/lib/llm";
import {
  buildAskMessages,
  composeOfflineAnswer,
  relevantSources,
  retrieveForQuestion,
  toResolved,
} from "@/lib/qa";
import type { AskSource } from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AskBody {
  domain: string;
  question: string;
  language?: string;
  grounding?: string;
  /** The case's own citations, so the answer is grounded in jurisdiction-correct rules. */
  caseSources?: AskSource[];
}

export async function POST(req: Request) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ ok: false, error: "Ask a question first." }, { status: 400 });
  }
  const language = body.language ?? "en";

  // Lexical matches power the citation chips; `broad` is a never-empty source set so
  // even a vague question ("what should I do?") still has material to answer from.
  const retrieved = retrieveForQuestion(body.domain, question, 3);
  const broad = relevantSources(body.domain, question, 6);
  const citations = toResolved(retrieved.length ? retrieved : broad);

  // Build the source set the model grounds in: the case's own citations first
  // (jurisdiction-correct), then any domain rules that lexically match the question.
  // Fall back to the domain's key rules only when we'd otherwise have nothing.
  const lite = (e: { topic: string; summary: string; officialCitation: string }): AskSource => ({
    topic: e.topic,
    summary: e.summary,
    cite: e.officialCitation,
  });
  const caseSources = Array.isArray(body.caseSources) ? body.caseSources : [];
  const matched = broad.filter((e) => e.relevance > 0).map(lite);
  const merged = [...caseSources, ...matched];
  const candidates = merged.length > 0 ? merged : broad.map(lite);

  const seen = new Set<string>();
  const sources: AskSource[] = [];
  for (const s of candidates) {
    const key = s.cite || s.topic;
    if (s.summary && !seen.has(key)) {
      seen.add(key);
      sources.push(s);
    }
  }

  // Ask Ollama (only Ollama for this feature) to interpret the question and answer,
  // grounded in those sources + the case facts. No early bail on a weak keyword match.
  const cfg = readLlmConfig();
  if (!cfg.forceOffline && sources.length > 0 && (await ollamaAvailable(cfg))) {
    try {
      const answer = await ollamaChat(cfg, {
        model: cfg.modelDraft,
        timeoutMs: cfg.timeoutMs,
        messages: buildAskMessages(question, body.grounding ?? "", sources, language),
      });
      const text = answer.trim();
      if (text) {
        return NextResponse.json({ ok: true, answer: text, source: "llm", citations });
      }
    } catch {
      /* fall through to the grounded-but-unphrased answer */
    }
  }

  // No model reachable → compose straight from the sources (still grounded, not generic).
  return NextResponse.json({
    ok: true,
    answer: composeOfflineAnswer(retrieved.length ? retrieved : broad),
    source: "retrieval",
    citations,
  });
}
