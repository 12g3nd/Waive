import { NextResponse } from "next/server";
import type { NoticeSource } from "@/engine";
import { ollamaAvailable, ollamaChat, readLlmConfig } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClassifyBody {
  source?: NoticeSource;
}

const DOMAIN_LABEL: Record<string, string> = {
  benefits: "a Social Security overpayment notice",
  answer: "a debt-collection lawsuit",
};

/**
 * Best-effort guess of the notice type from an uploaded image, so the upload picker
 * can pre-select. A suggestion only — the person always confirms, and the
 * deterministic engine still decides the law. Degrades to { available: false } with
 * no model, in offline mode, or for non-image sources (so the UI just shows no hint).
 */
export async function POST(req: Request) {
  let body: ClassifyBody;
  try {
    body = (await req.json()) as ClassifyBody;
  } catch {
    return NextResponse.json({ available: false });
  }

  const cfg = readLlmConfig();
  const source = body.source;
  if (cfg.forceOffline || !source || source.kind !== "image") {
    return NextResponse.json({ available: false });
  }
  if (!(await ollamaAvailable(cfg))) {
    return NextResponse.json({ available: false });
  }

  try {
    const content = await ollamaChat(cfg, {
      model: cfg.modelExtract,
      timeoutMs: cfg.timeoutMs,
      messages: [
        {
          role: "system",
          content:
            "You label a scanned official notice. Reply with exactly one word: 'benefits' if it is a Social Security / SSA overpayment notice, 'answer' if it is a debt-collection lawsuit or court claim, or 'unknown'.",
        },
        {
          role: "user",
          content: "Which kind of notice is shown in this image?",
          images: [source.dataBase64],
        },
      ],
    });
    const word = content.toLowerCase().match(/benefits|answer|unknown/)?.[0];
    if (word === "benefits" || word === "answer") {
      return NextResponse.json({ available: true, domain: word, label: DOMAIN_LABEL[word] });
    }
    return NextResponse.json({ available: true, domain: null });
  } catch {
    return NextResponse.json({ available: false });
  }
}
