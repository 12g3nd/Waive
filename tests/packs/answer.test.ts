import { describe, expect, it } from "vitest";
import { InMemoryCitationResolver, type NoticeExtraction, type UserFacts } from "@/engine";
import { answerPack } from "@/packs/answer";
import { allCitations } from "@/corpus";

function claim(overrides: Partial<NoticeExtraction> = {}): NoticeExtraction {
  return {
    domain: "answer",
    issuer: "Superior Court of Justice (Small Claims Court), Toronto",
    recipientName: "Priya Sharma",
    claimType: "credit-card debt claim",
    amount: 4380.55,
    currency: "CAD",
    noticeDate: null,
    serviceOrReceiptDate: "2026-05-04",
    rawDates: [{ label: "Served", dateISO: "2026-05-04" }],
    partyOnOtherSide: "Velocity Receivables Inc.",
    identifiers: { claimNumber: "SC-24-0098765" },
    rawText: "SAMPLE Plaintiff's Claim",
    fieldConfidence: { issuer: 0.95, serviceOrReceiptDate: 0.92, amount: 0.93 },
    ...overrides,
  };
}
const facts = (answers: UserFacts["answers"]): UserFacts => ({ answers });

describe("answer deadlines (golden)", () => {
  it("computes the 20-day Defence deadline from the service date, rolled to a court day", () => {
    // 2026-05-04 (Mon) + 20 = 2026-05-24 (Sunday) → rolls to Monday 2026-05-25.
    const r = answerPack.computeDeadlines(claim());
    expect(r.primaryDeadlineId).toBe("defence20");
    expect(r.deadlines[0]?.dateISO).toBe("2026-05-25");
    expect(r.deadlines[0]?.rule).toMatch(/20 days/);
    expect(r.deadlines[0]?.rule).toMatch(/default/i);
  });

  it("returns no deadline when there is no service or notice date", () => {
    const r = answerPack.computeDeadlines(claim({ serviceOrReceiptDate: null, noticeDate: null }));
    expect(r.deadlines).toHaveLength(0);
  });
});

describe("answer defences", () => {
  it("fires time-barred when the last activity is more than 2 years before the claim", () => {
    const r = answerPack.checkPresumptions(
      claim({ serviceOrReceiptDate: "2026-05-04" }),
      facts({ lastActivityDate: "2023-01-10" }),
    );
    const tb = r.catches.find((c) => c.id === "time-barred");
    expect(tb?.strength).toBe("automatic");
  });

  it("does NOT fire time-barred when the debt is recent (within 2 years)", () => {
    const r = answerPack.checkPresumptions(
      claim({ serviceOrReceiptDate: "2026-05-04" }),
      facts({ lastActivityDate: "2025-06-01" }),
    );
    expect(r.catches.some((c) => c.id === "time-barred")).toBe(false);
  });

  it("flags debt-buyer standing from the plaintiff name even without intake", () => {
    const r = answerPack.checkPresumptions(claim(), facts({}));
    expect(r.catches.some((c) => c.id === "debt-buyer-standing")).toBe(true);
  });
});

describe("answer routing (integrity)", () => {
  it("routes a strong defence to a disputing Defence (Form 9A)", () => {
    const d = answerPack.routeRemedy(claim(), facts({ disputesDebt: true, lastActivityDate: "2022-01-01" }));
    expect(d.documentId).toBe("defence");
    expect(d.selected.id).toBe("dispute");
    expect(d.integrityNote).toBeUndefined();
  });

  it("does NOT invent a defence: an admitted debt → admit + propose terms + integrity note", () => {
    const d = answerPack.routeRemedy(
      claim({ partyOnOtherSide: "First National Bank" }), // not a debt buyer
      facts({ disputesDebt: false, admitsOwes: true, lastActivityDate: "2025-06-01" }),
    );
    expect(d.selected.id).toBe("admit-propose");
    expect(d.integrityNote).toMatch(/not inventing a defence/i);
  });
});

describe("answer corpus integrity", () => {
  const resolver = new InMemoryCitationResolver(allCitations);
  it("resolves every citation id the answer pack relies on", () => {
    for (const id of answerPack.citationIndex) {
      expect(resolver.has(id), `missing corpus entry: ${id}`).toBe(true);
    }
  });
  it("every answer corpus entry is verified (no TODO_CITATION in this pack)", () => {
    for (const id of answerPack.citationIndex) {
      expect(resolver.resolve(id)?.verified, `unverified: ${id}`).toBe(true);
    }
  });
});
