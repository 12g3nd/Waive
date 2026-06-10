import { isValidISODate, type NoticeExtraction, type RulePack } from "@/engine";
import type { ExtractionRequest } from "@/engine";
import type { LlmConfig } from "./config";
import { OllamaError, ollamaChat, parseJsonLoose } from "./ollama";

/** JSON schema handed to Ollama's `format` to force a structured extraction. */
export const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    issuer: { type: "string" },
    recipientName: { type: ["string", "null"] },
    claimType: { type: "string" },
    amount: { type: ["number", "null"] },
    currency: { type: "string" },
    noticeDate: { type: ["string", "null"] },
    serviceOrReceiptDate: { type: ["string", "null"] },
    rawDates: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, dateISO: { type: "string" } },
        required: ["label", "dateISO"],
      },
    },
    partyOnOtherSide: { type: ["string", "null"] },
    identifiers: { type: "object" },
    rawText: { type: "string" },
    fieldConfidence: { type: "object" },
  },
  required: ["issuer", "claimType", "rawText"],
} as const;

export const SYSTEM_PROMPT = `You are a careful document-reading assistant for a legal-aid tool. You READ an official notice and transcribe what it says into a fixed JSON schema. You do NOT give legal advice, draw legal conclusions, or invent facts. If a field is not present in the document, use null (or an empty object/array). Dates MUST be ISO format YYYY-MM-DD. For each field you fill, include a confidence from 0 to 1 in fieldConfidence reflecting how clearly the document supported it. Redact any full SSN to its last 4 digits.`;

export function userPrompt(domainHint: string): string {
  return `This is a "${domainHint}" notice. Read it and fill the JSON schema:
- issuer: the agency/court/company that sent it
- recipientName: who it is addressed to (or null)
- claimType: short description (e.g. "SSDI overpayment", "credit-card debt claim")
- amount: the money amount in question as a number (or null)
- currency: ISO currency code (default "USD")
- noticeDate: the date printed on the notice (YYYY-MM-DD or null)
- serviceOrReceiptDate: date served/received if shown (or null)
- rawDates: every date you see, each with a short label
- partyOnOtherSide: plaintiff / agency unit / collector (or null)
- identifiers: case number, claim id, notice number, SSN last 4 (key→value)
- rawText: a faithful transcription of the visible text
- fieldConfidence: 0..1 per field above

Return only the JSON.`;
}

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0.5;
  return Math.min(1, Math.max(0, v));
}

function asStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function asISODateOrNull(v: unknown): string | null {
  return typeof v === "string" && isValidISODate(v) ? v : null;
}

/**
 * Coerce a model's (possibly messy) JSON into a valid NoticeExtraction. Pure and
 * defensive: every field is normalized, dates are validated, confidences clamped,
 * and the domain is set by us (the model never decides the domain).
 */
export function normalizeExtraction(raw: unknown, domain: string): NoticeExtraction {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const identifiers: Record<string, string> = {};
  if (o.identifiers && typeof o.identifiers === "object") {
    for (const [k, val] of Object.entries(o.identifiers as Record<string, unknown>)) {
      if (val != null) identifiers[k] = String(val);
    }
  }

  const fieldConfidence: Record<string, number> = {};
  if (o.fieldConfidence && typeof o.fieldConfidence === "object") {
    for (const [k, val] of Object.entries(o.fieldConfidence as Record<string, unknown>)) {
      fieldConfidence[k] = clamp01(val);
    }
  }

  const rawDates: { label: string; dateISO: string }[] = [];
  if (Array.isArray(o.rawDates)) {
    for (const d of o.rawDates) {
      if (d && typeof d === "object") {
        const label = asStringOrNull((d as Record<string, unknown>).label);
        const dateISO = asISODateOrNull((d as Record<string, unknown>).dateISO);
        if (label && dateISO) rawDates.push({ label, dateISO });
      }
    }
  }

  const amountRaw = o.amount;
  const amount =
    typeof amountRaw === "number" && Number.isFinite(amountRaw)
      ? amountRaw
      : typeof amountRaw === "string" && amountRaw.trim() !== "" && Number.isFinite(Number(amountRaw.replace(/[^0-9.-]/g, "")))
        ? Number(amountRaw.replace(/[^0-9.-]/g, ""))
        : null;

  return {
    domain,
    issuer: asStringOrNull(o.issuer) ?? "Unknown issuer",
    recipientName: asStringOrNull(o.recipientName),
    claimType: asStringOrNull(o.claimType) ?? "official notice",
    amount,
    currency: asStringOrNull(o.currency) ?? "USD",
    noticeDate: asISODateOrNull(o.noticeDate),
    serviceOrReceiptDate: asISODateOrNull(o.serviceOrReceiptDate),
    rawDates,
    partyOnOtherSide: asStringOrNull(o.partyOnOtherSide),
    identifiers,
    rawText: asStringOrNull(o.rawText) ?? "",
    fieldConfidence,
  };
}

/**
 * Read an uploaded notice into the schema using a local Ollama model.
 * Images use a vision model; PDFs have their text extracted first, then a text
 * model structures the result — so PDFs work without a vision-capable model.
 * Throws OllamaError on failure.
 */
export async function extractWithOllama(
  req: ExtractionRequest,
  pack: RulePack,
  cfg: LlmConfig,
): Promise<NoticeExtraction> {
  if (req.source.kind === "image") {
    const content = await ollamaChat(cfg, {
      model: cfg.modelExtract,
      format: EXTRACTION_SCHEMA,
      timeoutMs: cfg.timeoutMs,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(req.domainHint), images: [req.source.dataBase64] },
      ],
    });
    return normalizeExtraction(parseJsonLoose(content), pack.id);
  }

  if (req.source.kind === "pdf") {
    const buffer = Buffer.from(req.source.dataBase64, "base64");
    let pdfText: string;
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      pdfText = result.text ?? "";
    } catch {
      throw new OllamaError(
        "Could not extract text from the PDF — it may be corrupted or password-protected.",
      );
    }
    if (!pdfText.trim()) {
      throw new OllamaError(
        "No readable text found in the PDF. If it is a scanned document, upload a photo of the page instead.",
      );
    }
    const content = await ollamaChat(cfg, {
      model: cfg.modelDraft,
      format: EXTRACTION_SCHEMA,
      timeoutMs: cfg.timeoutMs,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${userPrompt(req.domainHint)}\n\nDocument text (extracted from PDF):\n${pdfText.slice(0, 8_000)}`,
        },
      ],
    });
    return normalizeExtraction(parseJsonLoose(content), pack.id);
  }

  throw new OllamaError(`Unsupported source kind: "${(req.source as { kind: string }).kind}".`);
}
