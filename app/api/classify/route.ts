import { NextResponse } from "next/server";
import type { NoticeSource } from "@/engine";
import { ollamaAvailable, ollamaChat, readLlmConfig } from "@/lib/llm";
import { classifyNoticeWithAnthropic } from "@/lib/llm/anthropic";

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
 * Best-effort guess of the notice type from an uploaded file, so the upload step can
 * pre-select the right pack — or warn when the file doesn't look like a notice we
 * handle. A suggestion only; the person always confirms and the deterministic engine
 * still decides the law. Uses whichever provider is active (Claude or Ollama).
 *
 * Response shape:
 *   { available: false }                → no model, or the source can't be read
 *   { available: true, domain: null }   → read it, but it is NOT an SSA or debt notice
 *   { available: true, domain, label }  → recognized
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
  if (cfg.forceOffline || !source) {
    return NextResponse.json({ available: false });
  }

  // Claude path — reads images and PDFs.
  if (cfg.provider === "anthropic" && cfg.anthropicApiKey) {
    try {
      const domain = await classifyNoticeWithAnthropic(cfg, source);
      return NextResponse.json({
        available: true,
        domain,
        label: domain ? DOMAIN_LABEL[domain] : null,
      });
    } catch {
      return NextResponse.json({ available: false });
    }
  }

  // Ollama path — images only.
  if (source.kind !== "image" || !(await ollamaAvailable(cfg))) {
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
