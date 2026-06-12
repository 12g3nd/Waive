import { NextResponse } from "next/server";
import type { ResolvedCitation } from "@/engine";
import { ollamaAvailable, ollamaChat, readLlmConfig } from "@/lib/llm";
import {
  buildAskMessages,
  composeOfflineAnswer,
  composeSmalltalkReply,
  isSmalltalk,
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
  caseSources?: ResolvedCitation[];
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

  // A greeting or filler ("hi", "thanks", "test") is not a question about the notice —
  // answer it as smalltalk and steer back on-topic, never with unprompted legal advice.
  if (isSmalltalk(question)) {
    return NextResponse.json({
      ok: true,
      answer: composeSmalltalkReply(),
      source: "smalltalk",
      citations: [],
    });
  }

  const language = body.language ?? "en";

  // Build ONE ordered list of citations, used both as the numbered sources handed to
  // the model AND as what we return — so an inline [1]/[2] in the answer maps straight
  // to citations[0]/[1] and can render as the site's clickable citation chip.
  const retrieved = retrieveForQuestion(body.domain, question, 3);
  const broad = relevantSources(body.domain, question, 6);

  // The case's own citations first (jurisdiction-correct), then domain rules that
  // lexically match the question. Fall back to the domain's key rules otherwise.
  const caseCitations: ResolvedCitation[] = Array.isArray(body.caseSources) ? body.caseSources : [];
  const matched = toResolved(broad.filter((e) => e.relevance > 0));
  const seen = new Set<string>();
  const ordered: ResolvedCitation[] = [];
  for (const c of [...caseCitations, ...matched]) {
    if (c && c.id && c.summary && !seen.has(c.id)) {
      seen.add(c.id);
      ordered.push(c);
    }
  }
  const citations = ordered.length > 0 ? ordered : toResolved(broad);
  const sources: AskSource[] = citations.map((c) => ({
    topic: c.topic,
    summary: c.summary,
    cite: c.officialCitation,
  }));

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
