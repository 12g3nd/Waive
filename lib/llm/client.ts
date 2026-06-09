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
import { extractWithOllama } from "./extraction";
import { ollamaChat, parseJsonLoose } from "./ollama";

function languageName(code: string): string {
  const map: Record<string, string> = { en: "English", es: "Spanish (Español)" };
  return map[code] ?? code;
}

const GROUNDING_RULES =
  "STRICT RULES: The text you are given is already legally vetted and TRUE. Your ONLY job is to make it clearer and warmer for a worried, non-expert reader, and to write it in the requested language. You MUST NOT add, remove, or change any legal claim, deadline, date, dollar amount, form name/number, statute, or fact. Keep every specific date, form (e.g. SSA-632), and number exactly. Do not invent anything. Output ONLY the requested JSON.";

/**
 * The production LlmPort. It treats the deterministic outputs as ground truth:
 * `explain`/`draft` first build the deterministic version, then ask the local
 * model only to rephrase and translate it — never to originate legal content. Any
 * model failure (offline, timeout, bad JSON) silently returns the deterministic
 * version, so the pipeline never breaks. `extract` requires the model.
 */
export class OllamaLlm implements LlmPort {
  constructor(
    private readonly cfg: LlmConfig,
    private readonly fallback: DeterministicFallbackLlm = new DeterministicFallbackLlm(),
  ) {}

  extract(req: ExtractionRequest, pack: RulePack): Promise<NoticeExtraction> {
    return extractWithOllama(req, pack, this.cfg);
  }

  async explain(req: ExplainRequest): Promise<PlainLanguageExplanation> {
    const base = buildExplanation(req);
    try {
      const content = await ollamaChat(this.cfg, {
        model: this.cfg.modelDraft,
        format: "json",
        timeoutMs: this.cfg.timeoutMs,
        messages: [
          {
            role: "system",
            content: `You translate and simplify plain-language explanations for a legal-aid tool. ${GROUNDING_RULES} Output JSON with keys: whatThisIs, whatHappensIfIgnored, whatToDoNow.`,
          },
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
      const parsed = parseJsonLoose(content) as Record<string, unknown>;
      const pick = (k: keyof PlainLanguageExplanation, fallbackVal: string) =>
        typeof parsed[k] === "string" && (parsed[k] as string).trim() ? (parsed[k] as string) : fallbackVal;
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
      const content = await ollamaChat(this.cfg, {
        model: this.cfg.modelDraft,
        format: "json",
        timeoutMs: this.cfg.timeoutMs,
        messages: [
          {
            role: "system",
            content: `You help a person turn a form outline into clear, first-person prose they can file. ${GROUNDING_RULES} Keep any "[Write your details here]" placeholders. Output JSON: { "coverExplanation": string, "body": [{ "id": string, "heading": string, "content": string }] }.`,
          },
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
      const parsed = parseJsonLoose(content) as {
        coverExplanation?: unknown;
        body?: unknown;
      };
      const body = Array.isArray(parsed.body)
        ? base.body.map((section) => {
            const match = (parsed.body as Array<Record<string, unknown>>).find(
              (s) => s.id === section.id,
            );
            const content2 = match && typeof match.content === "string" ? match.content : section.content;
            return { ...section, content: content2 };
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
