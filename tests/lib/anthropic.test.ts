import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { readLlmConfig } from "@/lib/llm/config";
import { AnthropicLlm } from "@/lib/llm/anthropic";
import { benefitsPack } from "@/packs/benefits";
import type { ExplainRequest, ExtractionRequest, NoticeExtraction } from "@/engine";

const cfg = readLlmConfig({ ANTHROPIC_API_KEY: "sk-test" });

/** A fake Claude client returning canned text — no network, no credits spent. */
function clientReturning(text: string): Anthropic {
  return {
    messages: { create: async () => ({ content: [{ type: "text", text }] }) },
  } as unknown as Anthropic;
}

function failingClient(): Anthropic {
  return {
    messages: {
      create: async () => {
        throw new Error("no network");
      },
    },
  } as unknown as Anthropic;
}

const imageReq: ExtractionRequest = {
  packId: "benefits",
  domainHint: "benefits",
  source: { kind: "image", mediaType: "image/png", dataBase64: "AAAA" },
};

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

describe("readLlmConfig — provider selection", () => {
  it("defaults to ollama when no key is present", () => {
    expect(readLlmConfig({}).provider).toBe("ollama");
  });
  it("selects anthropic when ANTHROPIC_API_KEY is set", () => {
    expect(readLlmConfig({ ANTHROPIC_API_KEY: "sk-x" }).provider).toBe("anthropic");
  });
  it("honors an explicit LLM_PROVIDER override", () => {
    expect(readLlmConfig({ ANTHROPIC_API_KEY: "sk-x", LLM_PROVIDER: "ollama" }).provider).toBe(
      "ollama",
    );
  });
  it("defaults the Claude model to claude-opus-4-8", () => {
    expect(readLlmConfig({}).anthropicModel).toBe("claude-opus-4-8");
  });
});

describe("AnthropicLlm", () => {
  it("extract parses Claude's JSON into a normalized extraction", async () => {
    const client = clientReturning(
      JSON.stringify({
        issuer: "Social Security Administration",
        claimType: "SSDI overpayment",
        noticeDate: "2026-05-15",
        amount: "$9,120.00",
        rawText: "SAMPLE",
      }),
    );
    const e = await new AnthropicLlm(cfg, client).extract(imageReq, benefitsPack);
    expect(e.domain).toBe("benefits"); // we set the domain, not the model
    expect(e.issuer).toBe("Social Security Administration");
    expect(e.noticeDate).toBe("2026-05-15");
    expect(e.amount).toBe(9120);
  });

  it("explain falls back to the deterministic text when the API call fails", async () => {
    const result = await new AnthropicLlm(cfg, failingClient()).explain(explainReq());
    expect(result.source).toBe("deterministic-fallback");
    expect(result.whatToDoNow).toMatch(/waiver|SSA-632/i);
  });

  it("extract throws when the API call fails (no offline substitute for reading)", async () => {
    await expect(
      new AnthropicLlm(cfg, failingClient()).extract(imageReq, benefitsPack),
    ).rejects.toThrow();
  });
});
