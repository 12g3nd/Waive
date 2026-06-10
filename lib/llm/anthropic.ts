import Anthropic from "@anthropic-ai/sdk";
import {
  DeterministicFallbackLlm,
  buildDraft,
  buildExplanation,
  type DraftedDocument,
  type DraftRequest,
  type ExplainRequest,
  type ExtractionRequest,
  type LlmPort,
  type NoticeExtraction,
  type PlainLanguageExplanation,
  type RulePack,
} from "@/engine";
import type { LlmConfig } from "./config";
import { SYSTEM_PROMPT, userPrompt, normalizeExtraction } from "./extraction";
import { parseJsonLoose } from "./ollama";

function languageName(code: string): string {
  const map: Record<string, string> = { en: "English", es: "Spanish (Español)" };
  return map[code] ?? code;
}

const GROUNDING_RULES =
  "STRICT RULES: The text you are given is already legally vetted and TRUE. Your ONLY job is to make it clearer and warmer for a worried, non-expert reader, and to write it in the requested language. You MUST NOT add, remove, or change any legal claim, deadline, date, dollar amount, form name/number, statute, or fact. Keep every specific date, form (e.g. SSA-632), and number exactly. Do not invent anything. Output ONLY the requested JSON and nothing else.";

/** Concatenate the text blocks of a Claude response. */
function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Claude-backed LlmPort for the online deploy (no local model needed). Same
 * contract as the Ollama client: the deterministic outputs are ground truth, and
 * `explain`/`draft` only rephrase/translate them — any API failure silently returns
 * the deterministic version so the pipeline never breaks. `extract` reads an
 * uploaded image OR PDF (Claude handles both) into the schema and throws on failure.
 */
export class AnthropicLlm implements LlmPort {
  constructor(
    private readonly cfg: LlmConfig,
    private readonly client: Anthropic = new Anthropic({ apiKey: cfg.anthropicApiKey }),
    private readonly fallback: DeterministicFallbackLlm = new DeterministicFallbackLlm(),
  ) {}

  async extract(req: ExtractionRequest, pack: RulePack): Promise<NoticeExtraction> {
    const content: Anthropic.ContentBlockParam[] = [];
    if (req.source.kind === "image") {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: req.source.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: req.source.dataBase64,
        },
      });
    } else {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: req.source.dataBase64 },
      });
    }
    content.push({ type: "text", text: userPrompt(req.domainHint) });

    const msg = await this.client.messages.create({
      model: this.cfg.anthropicModel,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
    return normalizeExtraction(parseJsonLoose(textOf(msg)), pack.id);
  }

  async explain(req: ExplainRequest): Promise<PlainLanguageExplanation> {
    const base = buildExplanation(req);
    try {
      const msg = await this.client.messages.create({
        model: this.cfg.anthropicModel,
        max_tokens: 1500,
        system: `You translate and simplify plain-language explanations for a legal-aid tool. ${GROUNDING_RULES} Output JSON with keys: whatThisIs, whatHappensIfIgnored, whatToDoNow.`,
        messages: [
          {
            role: "user",
            content: `Write in ${languageName(req.language)}. Rewrite these three statements:\n${JSON.stringify(
              {
                whatThisIs: base.whatThisIs,
                whatHappensIfIgnored: base.whatHappensIfIgnored,
                whatToDoNow: base.whatToDoNow,
              },
              null,
              2,
            )}`,
          },
        ],
      });
      const parsed = parseJsonLoose(textOf(msg)) as Record<string, unknown>;
      const pick = (k: keyof PlainLanguageExplanation, fallbackVal: string) =>
        typeof parsed[k] === "string" && (parsed[k] as string).trim()
          ? (parsed[k] as string)
          : fallbackVal;
      return {
        language: req.language,
        whatThisIs: pick("whatThisIs", base.whatThisIs),
        whatHappensIfIgnored: pick("whatHappensIfIgnored", base.whatHappensIfIgnored),
        whatToDoNow: pick("whatToDoNow", base.whatToDoNow),
        source: "llm",
      };
    } catch {
      return base; // deterministic-fallback
    }
  }

  async draft(req: DraftRequest): Promise<DraftedDocument> {
    const base = buildDraft(req);
    try {
      const msg = await this.client.messages.create({
        model: this.cfg.anthropicModel,
        max_tokens: 3000,
        system: `You help a person turn a form outline into clear, first-person prose they can file. ${GROUNDING_RULES} Keep any "[Write your details here]" placeholders. Output JSON: { "coverExplanation": string, "body": [{ "id": string, "heading": string, "content": string }] }.`,
        messages: [
          {
            role: "user",
            content: `Write in ${languageName(req.language)}. Improve the clarity of this draft without changing its meaning:\n${JSON.stringify(
              { coverExplanation: base.coverExplanation, body: base.body },
              null,
              2,
            )}`,
          },
        ],
      });
      const parsed = parseJsonLoose(textOf(msg)) as {
        coverExplanation?: unknown;
        body?: unknown;
      };
      const body = Array.isArray(parsed.body)
        ? base.body.map((section) => {
            const match = (parsed.body as Array<Record<string, unknown>>).find(
              (s) => s.id === section.id,
            );
            const content = match && typeof match.content === "string" ? match.content : section.content;
            return { ...section, content };
          })
        : base.body;
      return {
        ...base,
        coverExplanation:
          typeof parsed.coverExplanation === "string" && parsed.coverExplanation.trim()
            ? parsed.coverExplanation
            : base.coverExplanation,
        body,
        // filingChecklist stays deterministic — the model never edits the legal checklist.
        filingChecklist: base.filingChecklist,
        source: "llm",
      };
    } catch {
      return base; // deterministic-fallback
    }
  }
}
