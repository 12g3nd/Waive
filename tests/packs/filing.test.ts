import { describe, expect, it } from "vitest";
import { runPipeline, DeterministicFallbackLlm } from "@/engine";
import { benefitsPack } from "@/packs/benefits";
import { answerPacks } from "@/packs/answer";
import { buildRegistry } from "@/packs";
import { corpus } from "@/corpus";
import { getSample, todayISO } from "@/samples";

describe("filing guides — benefits (SSA)", () => {
  it("every SSA document carries a filing guide", () => {
    for (const doc of benefitsPack.documents) {
      expect(doc.filing, `${doc.id} should have a filing guide`).toBeTruthy();
    }
  });

  it("each guide has where-to-send, channels, a fee summary, and a resolvable citation", () => {
    for (const doc of benefitsPack.documents) {
      const f = doc.filing!;
      expect(f.whereToSend).toBeTruthy();
      expect(f.channels.length).toBeGreaterThan(0);
      expect(f.fee.summary).toBeTruthy();
      if (f.citationId) expect(corpus.has(f.citationId)).toBe(true);
    }
  });

  it("never fabricates a URL — any link is a real https address", () => {
    for (const doc of benefitsPack.documents) {
      for (const ch of doc.filing!.channels) {
        if (ch.url) expect(ch.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe("filing guides — debt claims (per jurisdiction)", () => {
  it("every jurisdiction's response doc has a guide that offers a fee waiver", () => {
    expect(answerPacks.length).toBeGreaterThan(0);
    for (const pack of answerPacks) {
      const doc = pack.documents.find((d) => d.id === "response");
      expect(doc?.filing, `${pack.id} response should have a filing guide`).toBeTruthy();
      const f = doc!.filing!;
      expect(f.channels.length).toBeGreaterThan(0);
      // Courts charge a fee, so a waiver path must be surfaced for low-income users.
      expect(f.fee.feeWaiver).toBeTruthy();
      expect(corpus.has(f.citationId!)).toBe(true);
    }
  });
});

describe("filing guides — pipeline", () => {
  it("surfaces result.filing for a routed sample", async () => {
    const sample = getSample("ssdi-not-at-fault")!;
    const today = todayISO();
    const result = await runPipeline(
      {
        packId: sample.packId,
        userFacts: sample.buildFacts(today),
        source: { kind: "extraction", extraction: sample.buildExtraction(today) },
      },
      { registry: buildRegistry(), llm: new DeterministicFallbackLlm(), corpus },
    );
    expect(result.filing).toBeTruthy();
    expect(result.filing!.channels.length).toBeGreaterThan(0);
    expect(result.filing!.fee.summary).toBeTruthy();
  });
});
