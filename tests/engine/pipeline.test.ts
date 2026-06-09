import { describe, expect, it } from "vitest";
import {
  DeterministicFallbackLlm,
  InMemoryCitationResolver,
  PackRegistry,
  UnknownPackError,
  runPipeline,
  type PipelineDeps,
} from "@/engine";
import {
  FakeModelLlm,
  brokenPack,
  fakeCorpus,
  fakePack,
  highConfidenceExtraction,
} from "./fixtures";

function makeDeps(overrides: Partial<PipelineDeps> = {}): PipelineDeps {
  const registry = new PackRegistry();
  registry.register(fakePack);
  registry.register(brokenPack);
  return {
    registry,
    llm: new DeterministicFallbackLlm(),
    corpus: new InMemoryCitationResolver(fakeCorpus),
    now: new Date("2025-04-26T12:00:00Z"),
    ...overrides,
  };
}

describe("runPipeline — domain-blind orchestration", () => {
  it("runs the full pipeline from a precomputed extraction (offline path)", async () => {
    const result = await runPipeline(
      {
        packId: "fake",
        userFacts: { answers: { flag: true, atFault: false } },
        source: { kind: "extraction", extraction: highConfidenceExtraction() },
      },
      makeDeps(),
    );

    // Deterministic core produced deadlines + routed remedy + fired presumption.
    expect(result.deadlines.primaryDeadlineId).toBe("respond");
    expect(result.deadlines.deadlines[0]?.dateISO).toBe("2025-05-05"); // 04-25 +10 = 05-05 (Mon)
    expect(result.remedy.selected.id).toBe("fight");
    expect(result.presumptions.catches[0]?.strength).toBe("automatic");

    // The explanation/draft came from the deterministic fallback (no model).
    expect(result.usedModel).toBe(false);
    expect(result.explanation.source).toBe("deterministic-fallback");
    expect(result.draftedDocument.body).toHaveLength(2);

    // Every cited id resolved to a corpus entry.
    const ids = result.citations.map((c) => c.id).sort();
    expect(ids).toContain("fake-deadline");
    expect(ids).toContain("fake-remedy");
    expect(ids).toContain("fake-catch");

    // High-confidence extraction → no escalation.
    expect(result.confidence.level).toBe("high");
    expect(result.confidence.escalate).toBe(false);
  });

  it("routes the at-fault path to the honest remedy with an integrity note", async () => {
    const result = await runPipeline(
      {
        packId: "fake",
        userFacts: { answers: { flag: false, atFault: true } },
        source: { kind: "extraction", extraction: highConfidenceExtraction() },
      },
      makeDeps(),
    );
    expect(result.remedy.selected.id).toBe("pay");
    expect(result.remedy.integrityNote).toMatch(/honest path/i);
    expect(result.presumptions.catches).toHaveLength(0);
  });

  it("uses the model path when given a real (fake) LLM and image source", async () => {
    const result = await runPipeline(
      {
        packId: "fake",
        userFacts: { answers: {} },
        source: { kind: "image", mediaType: "image/png", dataBase64: "AAAA" },
      },
      makeDeps({ llm: new FakeModelLlm() }),
    );
    expect(result.usedModel).toBe(true);
    expect(result.explanation.source).toBe("llm");
    expect(result.extraction.rawText).toBe("extracted-by-fake-model");
  });

  it("escalates when there is no anchor date to start the clock", async () => {
    const result = await runPipeline(
      {
        packId: "fake",
        userFacts: { answers: {} },
        source: {
          kind: "extraction",
          extraction: highConfidenceExtraction({
            noticeDate: null,
            serviceOrReceiptDate: null,
            fieldConfidence: { issuer: 0.4 },
          }),
        },
      },
      makeDeps(),
    );
    expect(result.deadlines.deadlines).toHaveLength(0);
    expect(result.confidence.escalate).toBe(true);
    expect(result.confidence.escalationReason).toMatch(/legal-aid clinic/i);
  });

  it("throws a clear error for an unknown pack", async () => {
    await expect(
      runPipeline(
        {
          packId: "nope",
          userFacts: { answers: {} },
          source: { kind: "extraction", extraction: highConfidenceExtraction() },
        },
        makeDeps(),
      ),
    ).rejects.toBeInstanceOf(UnknownPackError);
  });

  it("throws when a pack routes to a document it does not define", async () => {
    await expect(
      runPipeline(
        {
          packId: "broken",
          userFacts: { answers: {} },
          source: { kind: "extraction", extraction: highConfidenceExtraction() },
        },
        makeDeps(),
      ),
    ).rejects.toThrow(/not in its documents list/);
  });
});
