import { NextResponse } from "next/server";
import { ollamaAvailable, ollamaChat, readLlmConfig } from "@/lib/llm";
import {
  buildAskMessages,
  composeOfflineAnswer,
  retrieveForQuestion,
  toResolved,
} from "@/lib/qa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AskBody {
  domain: string;
  question: string;
  language?: string;
  grounding?: string;
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

  // Retrieve grounding from the curated corpus, scoped to this notice's domain.
  const entries = retrieveForQuestion(body.domain, question, 3);
  const citations = toResolved(entries);
  const language = body.language ?? "en";

  // If a local model is available, let it phrase a grounded answer; otherwise return
  // the matched corpus summaries directly. Either way it is corpus-grounded.
  const cfg = readLlmConfig();
  if (!cfg.forceOffline && entries.length > 0 && (await ollamaAvailable(cfg))) {
    try {
      const answer = await ollamaChat(cfg, {
        model: cfg.modelDraft,
        timeoutMs: cfg.timeoutMs,
        messages: buildAskMessages(question, body.grounding ?? "", entries, language),
      });
      const text = answer.trim();
      if (text) {
        return NextResponse.json({ ok: true, answer: text, source: "llm", citations });
      }
    } catch {
      /* fall through to offline */
    }
  }

  return NextResponse.json({
    ok: true,
    answer: composeOfflineAnswer(entries),
    source: "retrieval",
    citations,
  });
}
