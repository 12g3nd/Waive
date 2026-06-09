import { describe, expect, it } from "vitest";
import { InMemoryCitationResolver, type NoticeExtraction, type RulePack, type UserFacts } from "@/engine";
import { answerPack, answerPacks } from "@/packs/answer";
import { allCitations } from "@/corpus";

const pack = (id: string): RulePack => answerPacks.find((p) => p.id === id)!;

function claim(overrides: Partial<NoticeExtraction> = {}): NoticeExtraction {
  return {
    domain: "answer",
    issuer: "Court",
    recipientName: "Priya Sharma",
    claimType: "credit-card debt claim",
    amount: 4380.55,
    currency: "CAD",
    noticeDate: null,
    serviceOrReceiptDate: "2026-05-04", // a Monday
    rawDates: [{ label: "Served", dateISO: "2026-05-04" }],
    partyOnOtherSide: "Velocity Receivables Inc.",
    identifiers: { claimNumber: "SC-24-0098765" },
    rawText: "SAMPLE",
    fieldConfidence: { issuer: 0.95, serviceOrReceiptDate: 0.92, amount: 0.93 },
    ...overrides,
  };
}
const facts = (answers: UserFacts["answers"]): UserFacts => ({ answers });

describe("answer deadlines per jurisdiction (golden)", () => {
  it("Ontario: 20 days, rolled across the weekend", () => {
    // 2026-05-04 (Mon) + 20 = 2026-05-24 (Sun) → Monday 2026-05-25.
    const r = pack("answer-on").computeDeadlines(claim());
    expect(r.primaryDeadlineId).toBe("response");
    expect(r.deadlines[0]?.dateISO).toBe("2026-05-25");
    expect(r.deadlines[0]?.rule).toMatch(/20 days/);
    expect(r.deadlines[0]?.rule).toMatch(/default/i);
  });

  it("British Columbia: 14 days, rolled across Victoria Day", () => {
    // 2026-05-04 + 14 = 2026-05-18 (Victoria Day) → Tuesday 2026-05-19.
    const r = pack("answer-bc").computeDeadlines(claim());
    expect(r.deadlines[0]?.dateISO).toBe("2026-05-19");
    expect(r.deadlines[0]?.rule).toMatch(/14 days/);
  });

  it("California: 30 days", () => {
    // 2026-05-04 + 30 = 2026-06-03 (Wed).
    const r = pack("answer-ca").computeDeadlines(claim());
    expect(r.deadlines[0]?.dateISO).toBe("2026-06-03");
    expect(r.deadlines[0]?.rule).toMatch(/30 days/);
  });

  it("returns no deadline with no service/notice date", () => {
    const r = answerPack.computeDeadlines(claim({ serviceOrReceiptDate: null, noticeDate: null }));
    expect(r.deadlines).toHaveLength(0);
  });
});

describe("answer time-barred uses each jurisdiction's limitation period", () => {
  it("Ontario/BC (2 yr): a 2023 last-activity is barred by a 2026 claim", () => {
    for (const id of ["answer-on", "answer-bc"]) {
      const r = pack(id).checkPresumptions(claim(), facts({ lastActivityDate: "2023-01-10" }));
      expect(r.catches.find((c) => c.id === "time-barred")?.strength).toBe("automatic");
    }
  });

  it("California (4 yr): the SAME 2023 date is NOT yet barred, but a 2021 date is", () => {
    const notBarred = pack("answer-ca").checkPresumptions(claim(), facts({ lastActivityDate: "2023-01-10" }));
    expect(notBarred.catches.some((c) => c.id === "time-barred")).toBe(false);
    const barred = pack("answer-ca").checkPresumptions(claim(), facts({ lastActivityDate: "2021-01-10" }));
    expect(barred.catches.find((c) => c.id === "time-barred")?.strength).toBe("automatic");
  });

  it("flags debt-buyer standing from the plaintiff name, with the jurisdiction's citation", () => {
    const r = pack("answer-ca").checkPresumptions(claim({ partyOnOtherSide: "Meridian Portfolio Acquisitions LLC" }), facts({}));
    const standing = r.catches.find((c) => c.id === "debt-buyer-standing");
    expect(standing?.citationId).toBe("ans-ca-standing");
    expect(standing?.explanation).toMatch(/Fair Debt Buying Practices Act/i);
  });
});

describe("answer routing (integrity)", () => {
  it("routes a strong defence to a disputing response", () => {
    const d = answerPack.routeRemedy(claim(), facts({ disputesDebt: true, lastActivityDate: "2022-01-01" }));
    expect(d.documentId).toBe("response");
    expect(d.selected.id).toBe("dispute");
    expect(d.integrityNote).toBeUndefined();
  });

  it("does NOT invent a defence: an admitted debt → respond + integrity note", () => {
    const d = answerPack.routeRemedy(
      claim({ partyOnOtherSide: "First National Bank" }), // not a debt buyer
      facts({ disputesDebt: false, admitsOwes: true, lastActivityDate: "2025-06-01" }),
    );
    expect(d.selected.id).toBe("admit-respond");
    expect(d.integrityNote).toMatch(/not inventing a defence/i);
  });
});

describe("answer corpus integrity (all jurisdictions)", () => {
  const resolver = new InMemoryCitationResolver(allCitations);
  it("resolves every citation every debt pack relies on, all verified", () => {
    for (const p of answerPacks) {
      for (const id of p.citationIndex) {
        expect(resolver.has(id), `missing: ${id}`).toBe(true);
        expect(resolver.resolve(id)?.verified, `unverified: ${id}`).toBe(true);
      }
    }
  });

  it("ships three jurisdictions across Canada and the U.S.", () => {
    expect(answerPacks.map((p) => p.id).sort()).toEqual(["answer-bc", "answer-ca", "answer-on"]);
    expect(answerPacks.map((p) => p.jurisdiction).sort()).toEqual(["CA-BC", "CA-ON", "US-CA"]);
  });
});
