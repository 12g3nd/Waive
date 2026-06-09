import { describe, expect, it } from "vitest";
import {
  DeterministicFallbackLlm,
  InMemoryCitationResolver,
  PackRegistry,
  isValidISODate,
  runPipeline,
} from "@/engine";
import { buildRegistry } from "@/packs";
import { allCitations } from "@/corpus";
import { SAMPLES, getSample } from "@/samples";

const TODAY = "2026-06-01";

function deps() {
  return {
    registry: buildRegistry(),
    llm: new DeterministicFallbackLlm(),
    corpus: new InMemoryCitationResolver(allCitations),
    now: new Date(`${TODAY}T12:00:00Z`),
  };
}

interface Expectation {
  documentId: string;
  selected: string;
  minCatches: number;
  hasIntegrityNote: boolean;
  level: "high" | "medium" | "low";
}

const EXPECT: Record<string, Expectation> = {
  "ssdi-not-at-fault": { documentId: "ssa-632", selected: "waiver", minCatches: 1, hasIntegrityNote: false, level: "high" },
  "ssdi-at-fault": { documentId: "repayment", selected: "repay", minCatches: 0, hasIntegrityNote: true, level: "high" },
  "debt-time-barred": { documentId: "defence", selected: "dispute", minCatches: 1, hasIntegrityNote: false, level: "high" },
};

describe("judge's-choice samples (golden)", () => {
  it("every sample has artwork, a valid anchor date, and a matching domain", () => {
    for (const s of SAMPLES) {
      const e = s.buildExtraction(TODAY);
      const anchor = e.noticeDate ?? e.serviceOrReceiptDate;
      expect(anchor && isValidISODate(anchor)).toBeTruthy();
      expect(anchor! < TODAY).toBe(true); // notice is in the past → live countdown
      expect(e.domain).toBe(s.packId);
      expect(s.imagePath).toMatch(/\.svg$/);
    }
  });

  for (const [sampleId, exp] of Object.entries(EXPECT)) {
    it(`"${sampleId}" runs end-to-end to the expected outcome`, async () => {
      const sample = getSample(sampleId)!;
      const result = await runPipeline(
        {
          packId: sample.packId,
          userFacts: sample.buildFacts(TODAY),
          source: { kind: "extraction", extraction: sample.buildExtraction(TODAY) },
        },
        deps(),
      );
      expect(result.remedy.documentId).toBe(exp.documentId);
      expect(result.remedy.selected.id).toBe(exp.selected);
      expect(result.presumptions.catches.length).toBeGreaterThanOrEqual(exp.minCatches);
      expect(Boolean(result.remedy.integrityNote)).toBe(exp.hasIntegrityNote);
      expect(result.confidence.level).toBe(exp.level);
      expect(result.citations.length).toBeGreaterThan(0);
    });
  }

  it("the cross-domain debt sample fires the time-barred defence", async () => {
    const sample = getSample("debt-time-barred")!;
    const result = await runPipeline(
      {
        packId: sample.packId,
        userFacts: sample.buildFacts(TODAY),
        source: { kind: "extraction", extraction: sample.buildExtraction(TODAY) },
      },
      deps(),
    );
    expect(result.domain).toBe("answer");
    expect(result.presumptions.catches.some((c) => c.id === "time-barred")).toBe(true);
  });

  it("the SSDI samples are the SAME notice, flipped only by facts", () => {
    const a = getSample("ssdi-not-at-fault")!.buildExtraction(TODAY);
    const b = getSample("ssdi-at-fault")!.buildExtraction(TODAY);
    expect(a.claimType).toBe(b.claimType);
    expect(a.amount).toBe(b.amount);
    expect(a.noticeDate).toBe(b.noticeDate);
    expect(a.recipientName).not.toBe(b.recipientName);
  });
});
