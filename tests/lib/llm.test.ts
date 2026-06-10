import { describe, expect, it } from "vitest";
import { readLlmConfig } from "@/lib/llm/config";
import { normalizeExtraction } from "@/lib/llm/extraction";
import { parseJsonLoose } from "@/lib/llm/ollama";
import { OllamaLlm } from "@/lib/llm/client";
import { benefitsPack } from "@/packs/benefits";
import type { ExplainRequest, NoticeExtraction } from "@/engine";

describe("readLlmConfig", () => {
  it("uses local Ollama defaults", () => {
    const cfg = readLlmConfig({});
    expect(cfg.baseUrl).toBe("http://localhost:11434");
    expect(cfg.modelExtract).toBe("llama3.2-vision");
    expect(cfg.modelDraft).toBe("llama3.2");
    expect(cfg.forceOffline).toBe(false);
  });

  it("honors env overrides and trims a trailing slash", () => {
    const cfg = readLlmConfig({
      OLLAMA_BASE_URL: "http://box:1234/",
      MODEL_EXTRACT: "qwen2.5vl",
      MODEL_DRAFT: "mistral",
      LLM_OFFLINE: "1",
    });
    expect(cfg.baseUrl).toBe("http://box:1234");
    expect(cfg.modelExtract).toBe("qwen2.5vl");
    expect(cfg.forceOffline).toBe(true);
  });
});

describe("parseJsonLoose", () => {
  it("parses clean JSON", () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
  });
  it("parses JSON wrapped in a code fence and prose", () => {
    expect(parseJsonLoose('Sure!\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
});

describe("normalizeExtraction", () => {
  it("coerces a messy model object into a valid NoticeExtraction", () => {
    const raw = {
      issuer: "Social Security Administration",
      claimType: "SSDI overpayment",
      amount: "$9,120.00",
      noticeDate: "2025-05-15",
      serviceOrReceiptDate: "not shown",
      rawDates: [
        { label: "Notice date", dateISO: "2025-05-15" },
        { label: "bad", dateISO: "May 2025" }, // dropped (invalid)
      ],
      identifiers: { noticeNumber: 44821 },
      fieldConfidence: { issuer: 1.4, amount: -2 }, // clamped
      rawText: "SAMPLE",
    };
    const e = normalizeExtraction(raw, "benefits");
    expect(e.domain).toBe("benefits");
    expect(e.amount).toBe(9120);
    expect(e.noticeDate).toBe("2025-05-15");
    expect(e.serviceOrReceiptDate).toBeNull(); // "not shown" is not ISO
    expect(e.rawDates).toHaveLength(1); // invalid date dropped
    expect(e.identifiers.noticeNumber).toBe("44821"); // stringified
    expect(e.fieldConfidence.issuer).toBe(1); // clamped to [0,1]
    expect(e.fieldConfidence.amount).toBe(0);
    expect(e.currency).toBe("USD"); // default
  });

  it("fills safe defaults when the model returns almost nothing", () => {
    const e = normalizeExtraction({}, "answer");
    expect(e.domain).toBe("answer");
    expect(e.issuer).toBe("Unknown issuer");
    expect(e.noticeDate).toBeNull();
    expect(e.rawDates).toEqual([]);
  });
});

describe("OllamaLlm graceful fallback (no server)", () => {
  function explainReq(): ExplainRequest {
    const extraction: NoticeExtraction = {
      domain: "benefits",
      issuer: "SSA",
      recipientName: "Jordan Rivera",
      claimType: "SSDI overpayment",
      amount: 9120,
      currency: "USD",
      noticeDate: "2025-05-15",
      serviceOrReceiptDate: null,
      rawDates: [],
      partyOnOtherSide: null,
      identifiers: {},
      rawText: "SAMPLE",
      fieldConfidence: { issuer: 0.9 },
    };
    return {
      language: "en",
      extraction,
      deadlines: benefitsPack.computeDeadlines(extraction),
      remedy: benefitsPack.routeRemedy(extraction, { answers: { timelyReported: true } }),
      presumptions: benefitsPack.checkPresumptions(extraction, { answers: { timelyReported: true } }),
      pack: benefitsPack,
    };
  }

  it("returns the deterministic explanation when Ollama is unreachable", async () => {
    const llm = new OllamaLlm({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:9", // nothing listening — connection refused
      apiKey: "",
      modelExtract: "x",
      modelDraft: "x",
      timeoutMs: 1_000,
      forceOffline: false,
      anthropicModel: "claude-opus-4-8",
    });
    const result = await llm.explain(explainReq());
    expect(result.source).toBe("deterministic-fallback");
    expect(result.whatToDoNow).toMatch(/waiver|SSA-632/i);
  });
});
