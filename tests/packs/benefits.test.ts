import { describe, expect, it } from "vitest";
import {
  DeterministicFallbackLlm,
  InMemoryCitationResolver,
  PackRegistry,
  isVerified,
  runPipeline,
  type NoticeExtraction,
  type UserFacts,
} from "@/engine";
import { benefitsPack } from "@/packs/benefits";
import { allCitations } from "@/corpus";
import benefitsCorpus from "@/corpus/benefits.json";

function notice(overrides: Partial<NoticeExtraction> = {}): NoticeExtraction {
  return {
    domain: "benefits",
    issuer: "Social Security Administration",
    recipientName: "Jordan Rivera",
    claimType: "SSDI overpayment",
    amount: 9120,
    currency: "USD",
    noticeDate: "2025-05-15",
    serviceOrReceiptDate: null,
    rawDates: [{ label: "Notice date", dateISO: "2025-05-15" }],
    partyOnOtherSide: "SSA Office of Central Operations",
    identifiers: { noticeNumber: "OP-2025-44821", ssnLast4: "••6789" },
    rawText: "SAMPLE — Notice of Overpayment",
    fieldConfidence: { issuer: 0.97, noticeDate: 0.95, amount: 0.93, claimType: 0.9 },
    ...overrides,
  };
}

const facts = (answers: UserFacts["answers"]): UserFacts => ({ answers });

// ─────────────────────────────────────────────────────────────────────────────
// Deadline math — golden derivations
// ─────────────────────────────────────────────────────────────────────────────
describe("benefits deadlines (golden)", () => {
  it("derives the 30-day pause, 60-day reconsideration, and 90-day withholding clock", () => {
    const r = benefitsPack.computeDeadlines(notice());

    expect(r.primaryDeadlineId).toBe("pause30");
    const byId = Object.fromEntries(r.deadlines.map((d) => [d.id, d]));

    // 2025-05-15 + 30 = 2025-06-14 (Saturday) → rolls to Monday 2025-06-16.
    expect(byId.pause30?.dateISO).toBe("2025-06-16");
    expect(byId.pause30?.protected).toBe(true);
    expect(byId.pause30?.rule).toMatch(/rolls to the next business day/);

    // 5-day mail presumption + 60 days = 2025-07-19 (Saturday) → Monday 2025-07-21.
    expect(byId.recon60?.dateISO).toBe("2025-07-21");
    expect(byId.recon60?.rule).toMatch(/404\.909/);

    // 2025-05-15 + 90 = 2025-08-13 (Wednesday) → no roll.
    expect(byId.withhold90?.dateISO).toBe("2025-08-13");
    expect(r.pauseWindow?.dateISO).toBe("2025-06-16");
  });

  it("flags the 50% withholding for notices on/after 2025-04-25", () => {
    const r = benefitsPack.computeDeadlines(notice({ noticeDate: "2025-05-15" }));
    const withhold = r.deadlines.find((d) => d.id === "withhold90");
    expect(withhold?.label).toMatch(/50%/);
    expect(withhold?.rule).toMatch(/EM-25029/);
  });

  it("does NOT assert the 50% rule for notices before 2025-04-25", () => {
    const r = benefitsPack.computeDeadlines(notice({ noticeDate: "2025-01-10" }));
    const withhold = r.deadlines.find((d) => d.id === "withhold90");
    expect(withhold?.label).toBe("Benefit recovery may begin");
    expect(withhold?.label).not.toMatch(/50%/);
  });

  it("returns no deadlines (engine will escalate) when there is no notice date", () => {
    const r = benefitsPack.computeDeadlines(notice({ noticeDate: null }));
    expect(r.deadlines).toHaveLength(0);
    expect(r.primaryDeadlineId).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Not-at-fault presumption checklist — the "gotcha engine"
// ─────────────────────────────────────────────────────────────────────────────
describe("benefits presumptions", () => {
  it("fires the timely-report automatic presumption (debt can be cancelled)", () => {
    const r = benefitsPack.checkPresumptions(notice(), facts({ timelyReported: true }));
    expect(r.catches).toHaveLength(1);
    expect(r.catches[0]?.id).toBe("timely-report");
    expect(r.catches[0]?.strength).toBe("automatic");
    expect(r.catches[0]?.headline).toMatch(/not at fault/i);
  });

  it("treats 'SSA cannot produce documents' as a strong (likely) catch", () => {
    const r = benefitsPack.checkPresumptions(notice(), facts({ ssaCannotProduceDocs: true }));
    expect(r.catches[0]?.id).toBe("ssa-cannot-document");
    expect(r.catches[0]?.strength).toBe("likely");
  });

  it("fires nothing for a clean at-fault profile", () => {
    const r = benefitsPack.checkPresumptions(
      notice(),
      facts({ timelyReported: false, reliedOnSsaInfo: false, pandemicPeriod: false }),
    );
    expect(r.catches).toHaveLength(0);
  });

  it("stacks multiple catches when several facts apply", () => {
    const r = benefitsPack.checkPresumptions(
      notice(),
      facts({ timelyReported: true, netVsGross: true, auxiliaryUnaware: true }),
    );
    const ids = r.catches.map((c) => c.id);
    expect(ids).toEqual(["timely-report", "net-vs-gross", "auxiliary-unaware"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Remedy routing — including integrity (no frivolous waiver)
// ─────────────────────────────────────────────────────────────────────────────
describe("benefits remedy routing", () => {
  it("routes a dispute to SSA-561 (reconsideration)", () => {
    const d = benefitsPack.routeRemedy(notice(), facts({ disputesOwes: true }));
    expect(d.documentId).toBe("ssa-561");
    expect(d.selected.id).toBe("reconsider");
  });

  it("routes a not-at-fault person to the SSA-632 waiver, with the hardship caveat", () => {
    const d = benefitsPack.routeRemedy(
      notice(),
      facts({ disputesOwes: false, timelyReported: true, canAfford: false }),
    );
    expect(d.documentId).toBe("ssa-632");
    expect(d.selected.id).toBe("waiver");
    expect(d.integrityNote).toBeUndefined();
    expect(d.selected.why).toMatch(/legal-aid clinic/i);
  });

  it("does NOT route an at-fault, can-pay person to a waiver — honest path + integrity note", () => {
    const d = benefitsPack.routeRemedy(
      notice(),
      facts({ disputesOwes: false, canAfford: true }),
    );
    expect(d.documentId).toBe("repayment");
    expect(d.selected.id).toBe("repay");
    expect(d.integrityNote).toMatch(/not routing you to a waiver/i);
  });

  it("routes an at-fault person who can't afford it to SSA-634 (lower the rate)", () => {
    const d = benefitsPack.routeRemedy(
      notice(),
      facts({ disputesOwes: false, canAfford: false }),
    );
    expect(d.documentId).toBe("ssa-634");
    expect(d.selected.id).toBe("rate");
  });

  it("every routed document exists in the pack's document specs", () => {
    const scenarios: UserFacts[] = [
      facts({ disputesOwes: true }),
      facts({ timelyReported: true }),
      facts({ canAfford: true }),
      facts({ canAfford: false }),
      facts({}),
    ];
    for (const f of scenarios) {
      const d = benefitsPack.routeRemedy(notice(), f);
      expect(benefitsPack.documents.some((doc) => doc.id === d.documentId)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Corpus integrity — every claim is citation-backed; only documented TODOs exist
// ─────────────────────────────────────────────────────────────────────────────
describe("benefits corpus integrity", () => {
  const resolver = new InMemoryCitationResolver(allCitations);

  it("resolves every citation id the pack declares it relies on", () => {
    for (const id of benefitsPack.citationIndex) {
      expect(resolver.has(id), `missing corpus entry: ${id}`).toBe(true);
    }
  });

  it("resolves every citation referenced by deadlines / router / presumptions / documents", () => {
    const ids = new Set<string>();
    for (const d of benefitsPack.computeDeadlines(notice()).deadlines) ids.add(d.citationId);
    for (const f of [facts({ disputesOwes: true }), facts({ timelyReported: true }), facts({ canAfford: true })]) {
      const r = benefitsPack.routeRemedy(notice(), f);
      ids.add(r.selected.citationId);
      r.alternatives.forEach((a) => ids.add(a.citationId));
    }
    for (const c of benefitsPack.checkPresumptions(notice(), facts({ timelyReported: true, ssaCannotProduceDocs: true })).catches) {
      ids.add(c.citationId);
    }
    for (const doc of benefitsPack.documents) {
      ids.add(doc.citationId);
      doc.filingChecklist.forEach((c) => c.citationId && ids.add(c.citationId));
    }
    for (const id of ids) expect(resolver.has(id), `unresolved: ${id}`).toBe(true);
  });

  it("has no unverified TODO_CITATION entries — every benefits claim is sourced", () => {
    const unverified = (benefitsCorpus as { id: string; officialCitation: string }[]).filter(
      (e) => !isVerified(e.officialCitation),
    );
    expect(unverified.map((e) => e.id)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end through the domain-blind engine
// ─────────────────────────────────────────────────────────────────────────────
describe("benefits end-to-end via runPipeline", () => {
  it("produces a full result and every cited source resolves", async () => {
    const registry = new PackRegistry().register(benefitsPack);
    const result = await runPipeline(
      {
        packId: "benefits",
        userFacts: facts({ timelyReported: true, canAfford: false }),
        source: { kind: "extraction", extraction: notice() },
      },
      {
        registry,
        llm: new DeterministicFallbackLlm(),
        corpus: new InMemoryCitationResolver(allCitations),
        now: new Date("2025-05-20T12:00:00Z"),
      },
    );

    expect(result.remedy.documentId).toBe("ssa-632");
    expect(result.presumptions.catches[0]?.strength).toBe("automatic");
    expect(result.draftedDocument.body.length).toBeGreaterThan(0);
    expect(result.confidence.level).toBe("high");
    // Every resolved citation is verified (no TODO_CITATION placeholders).
    const unverified = result.citations.filter((c) => !c.verified).map((c) => c.id);
    expect(unverified).toEqual([]);
  });
});
