import { addDays, toISODate, type NoticeExtraction, type UserFacts } from "@/engine";
import { DEBT_JURISDICTIONS, type DebtJurisdiction } from "@/packs/answer";

export interface Sample {
  id: string;
  packId: string;
  title: string;
  blurb: string;
  badge: string;
  tone: "primary" | "urgent" | "highlight";
  imagePath?: string;
  buildExtraction: (todayISO: string) => NoticeExtraction;
  buildFacts: (todayISO: string) => UserFacts;
}

// ─── Benefits samples (SSA, U.S. federal) ───────────────────────────────────
const benefitsSamples: Sample[] = [
  {
    id: "ssdi-not-at-fault",
    packId: "benefits",
    title: "SSDI overpayment — not at fault",
    blurb:
      "SSA overpaid through its own error after the person reported their work. The waiver can cancel the debt entirely.",
    badge: "not-at-fault → waiver",
    tone: "primary",
    imagePath: "/samples/ssdi-not-at-fault.svg",
    buildExtraction: (today) => ({
      domain: "benefits",
      issuer: "Social Security Administration",
      recipientName: "Jordan Rivera",
      claimType: "SSDI overpayment",
      amount: 9120,
      currency: "USD",
      noticeDate: addDays(today, -21),
      serviceOrReceiptDate: null,
      rawDates: [{ label: "Notice date", dateISO: addDays(today, -21) }],
      partyOnOtherSide: "SSA Office of Central Operations",
      identifiers: { noticeNumber: "OP-44821", ssnLast4: "••6789" },
      rawText:
        "SAMPLE — NOT A REAL NOTICE. Notice of Overpayment. Our records show we paid you $9,120.00 more than you were due. You reported your return to work; our records were not updated. Unless you act, we will withhold 50% of your monthly benefit.",
      fieldConfidence: { issuer: 0.97, noticeDate: 0.95, amount: 0.94, claimType: 0.92 },
    }),
    buildFacts: () => ({
      answers: {
        disputesOwes: false,
        timelyReported: true,
        reliedOnSsaInfo: false,
        pandemicPeriod: false,
        canAfford: false,
        monthlyBenefit: 1430,
        monthlyIncome: 1610,
        monthlyExpenses: 1880,
      },
    }),
  },
  {
    id: "ssdi-at-fault",
    packId: "benefits",
    title: "SSDI overpayment — at fault, can repay",
    blurb:
      "Same notice, different facts: the person didn't report and can afford it. Waive refuses the frivolous waiver and routes to the honest path.",
    badge: "integrity routing",
    tone: "highlight",
    imagePath: "/samples/ssdi-at-fault.svg",
    buildExtraction: (today) => ({
      domain: "benefits",
      issuer: "Social Security Administration",
      recipientName: "Marcus Bell",
      claimType: "SSDI overpayment",
      amount: 9120,
      currency: "USD",
      noticeDate: addDays(today, -21),
      serviceOrReceiptDate: null,
      rawDates: [{ label: "Notice date", dateISO: addDays(today, -21) }],
      partyOnOtherSide: "SSA Office of Central Operations",
      identifiers: { noticeNumber: "OP-44907", ssnLast4: "••3312" },
      rawText:
        "SAMPLE — NOT A REAL NOTICE. Notice of Overpayment. Our records show we paid you $9,120.00 more than you were due after you began working above the limit. Unless you act, we will withhold 50% of your monthly benefit.",
      fieldConfidence: { issuer: 0.97, noticeDate: 0.95, amount: 0.94, claimType: 0.92 },
    }),
    buildFacts: () => ({
      answers: {
        disputesOwes: false,
        timelyReported: false,
        reliedOnSsaInfo: false,
        pandemicPeriod: false,
        canAfford: true,
        monthlyBenefit: 2200,
        monthlyIncome: 5200,
        monthlyExpenses: 2600,
      },
    }),
  },
];

// ─── Debt samples (one per jurisdiction — the cross-domain + cross-jurisdiction reveal)
const DEBT_META: Record<DebtJurisdiction["id"], { defendant: string; blurb: string; badge: string; image?: string }> = {
  ON: {
    defendant: "Priya Sharma",
    blurb: "A debt buyer sues on a 3-year-old debt. Ontario: 20 days to file a Defence; the 2-year limit can end the case.",
    badge: "Canada · Ontario",
    image: "/samples/debt-claim-ontario.svg",
  },
  BC: {
    defendant: "Daniel Tremblay",
    blurb: "The SAME engine, B.C. rules: 14 days to file a Reply; 2-year limit; make the buyer prove it owns the debt.",
    badge: "Canada · B.C.",
    image: "/samples/debt-claim-bc.svg",
  },
  CA: {
    defendant: "Marcus Whitfield",
    blurb: "The SAME engine, U.S. rules: 30 days to Answer; 4-year limit; California's Fair Debt Buying Practices Act.",
    badge: "USA · California",
    image: "/samples/debt-claim-california.svg",
  },
  QC: {
    defendant: "Geneviève Tremblay",
    blurb: "The SAME engine, Quebec rules: 15 days to answer the summons; 3-year prescription; make the buyer prove the assignment.",
    badge: "Canada · Quebec",
    image: "/samples/debt-claim-quebec.svg",
  },
};

function makeDebtSample(j: DebtJurisdiction): Sample {
  const meta = DEBT_META[j.id];
  const moneyText =
    j.currency === "USD" ? `$${j.sample.amount.toFixed(2)}` : `CA$${j.sample.amount.toFixed(2)}`;
  return {
    id: `debt-${j.id.toLowerCase()}`,
    packId: j.packId,
    title: `Debt lawsuit — ${j.label}`,
    blurb: meta.blurb,
    badge: meta.badge,
    tone: "urgent",
    imagePath: meta.image,
    buildExtraction: (today) => {
      const served = addDays(today, -(j.responseDays - 6)); // deadline ~6 days out → urgent
      return {
        domain: "answer",
        issuer: j.court,
        recipientName: meta.defendant,
        claimType: "credit-card debt claim",
        amount: j.sample.amount,
        currency: j.currency,
        noticeDate: null,
        serviceOrReceiptDate: served,
        rawDates: [{ label: "Served", dateISO: served }],
        partyOnOtherSide: j.sample.plaintiff,
        identifiers: { claimNumber: j.sample.claimNo, jurisdiction: j.region },
        rawText: `SAMPLE — NOT A REAL NOTICE. The plaintiff claims ${moneyText} for an unpaid credit-card account assigned to it. You must respond within ${j.responseDays} days or the plaintiff may obtain default judgment.`,
        fieldConfidence: { issuer: 0.95, serviceOrReceiptDate: 0.93, amount: 0.94, claimType: 0.9 },
      };
    },
    buildFacts: (today) => ({
      answers: {
        disputesDebt: true,
        plaintiffIsDebtBuyer: true,
        lastActivityDate: addDays(today, -j.sample.lastActivityDaysAgo),
        admitsOwes: false,
      },
    }),
  };
}

export const SAMPLES: Sample[] = [
  ...benefitsSamples,
  ...DEBT_JURISDICTIONS.map(makeDebtSample),
];

export function getSample(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}

/** Today's date as an ISO string, for sample date computation. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}
