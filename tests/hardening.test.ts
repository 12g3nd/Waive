import { describe, expect, it } from "vitest";
import {
  DeterministicFallbackLlm,
  InMemoryCitationResolver,
  LlmUnavailableError,
  runPipeline,
  type NoticeExtraction,
  type PipelineDeps,
} from "@/engine";
import { buildRegistry } from "@/packs";
import { benefitsPack } from "@/packs/benefits";
import { answerPack } from "@/packs/answer";
import { allCitations } from "@/corpus";

function deps(): PipelineDeps {
  return {
    registry: buildRegistry(),
    llm: new DeterministicFallbackLlm(),
    corpus: new InMemoryCitationResolver(allCitations),
    now: new Date("2026-06-01T12:00:00Z"),
  };
}

function benefitsNotice(o: Partial<NoticeExtraction> = {}): NoticeExtraction {
  return {
    domain: "benefits",
    issuer: "Social Security Administration",
    recipientName: "Sam Lee",
    claimType: "SSDI overpayment",
    amount: 5000,
    currency: "USD",
    noticeDate: "2026-05-10",
    serviceOrReceiptDate: null,
    rawDates: [],
    partyOnOtherSide: null,
    identifiers: {},
    rawText: "SAMPLE",
    fieldConfidence: { issuer: 0.9, noticeDate: 0.9 },
    ...o,
  };
}

describe("hardening — escalation & edge cases", () => {
  it("escalates and shows no clock when the benefits notice has no date", async () => {
    const r = await runPipeline(
      {
        packId: "benefits",
        userFacts: { answers: {} },
        source: { kind: "extraction", extraction: benefitsNotice({ noticeDate: null }) },
      },
      deps(),
    );
    expect(r.deadlines.deadlines).toHaveLength(0);
    expect(r.confidence.escalate).toBe(true);
    expect(r.confidence.escalationReason).toMatch(/legal-aid clinic/i);
  });

  it("grades a barely-readable notice as low confidence and escalates", async () => {
    const r = await runPipeline(
      {
        packId: "benefits",
        userFacts: { answers: {} },
        source: {
          kind: "extraction",
          extraction: benefitsNotice({ fieldConfidence: { issuer: 0.3, noticeDate: 0.2, amount: 0.25 } }),
        },
      },
      deps(),
    );
    expect(r.confidence.level).toBe("low");
    expect(r.confidence.escalate).toBe(true);
    expect(r.confidence.lowConfidenceFields).toContain("noticeDate");
  });

  it("handles empty intake without crashing and routes to a sane default (SSA-634)", async () => {
    const r = await runPipeline(
      {
        packId: "benefits",
        userFacts: { answers: {} },
        source: { kind: "extraction", extraction: benefitsNotice() },
      },
      deps(),
    );
    expect(r.remedy.documentId).toBe("ssa-634");
    expect(r.draftedDocument.body.length).toBeGreaterThan(0);
  });

  it("escalates an Ontario claim with no service or notice date", async () => {
    const r = await runPipeline(
      {
        packId: "answer",
        userFacts: { answers: {} },
        source: {
          kind: "extraction",
          extraction: {
            domain: "answer",
            issuer: "Small Claims Court",
            recipientName: null,
            claimType: "debt claim",
            amount: 1000,
            currency: "CAD",
            noticeDate: null,
            serviceOrReceiptDate: null,
            rawDates: [],
            partyOnOtherSide: "A Collector",
            identifiers: {},
            rawText: "SAMPLE",
            fieldConfidence: { issuer: 0.6 },
          },
        },
      },
      deps(),
    );
    expect(r.deadlines.deadlines).toHaveLength(0);
    expect(r.confidence.escalate).toBe(true);
  });

  it("surfaces a clear error when a live image is uploaded but no model is available", async () => {
    await expect(
      runPipeline(
        {
          packId: "benefits",
          userFacts: { answers: {} },
          source: { kind: "image", mediaType: "image/png", dataBase64: "AAAA" },
        },
        deps(),
      ),
    ).rejects.toBeInstanceOf(LlmUnavailableError);
  });

  it("keeps both packs registered and domain-blind through the same engine", async () => {
    expect(buildRegistry().list().map((p) => p.id).sort()).toEqual(["answer", "benefits"]);
    expect(benefitsPack.jurisdiction).toBe("US-SSA");
    expect(answerPack.jurisdiction).toBe("ON-CA");
  });
});
