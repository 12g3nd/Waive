import { addDays, toISODate, type NoticeExtraction, type UserFacts } from "@/engine";

export interface Sample {
  id: string;
  packId: string;
  title: string;
  blurb: string;
  badge: string;
  /** Tailwind accent used on the badge/card. */
  tone: "primary" | "urgent" | "highlight";
  /** Rendered notice image for the vision path + card thumbnail. */
  imagePath?: string;
  /** Precomputed extraction (offline path) — dates filled fresh per request. */
  buildExtraction: (todayISO: string) => NoticeExtraction;
  /** Recommended intake answers; some dates are relative to today, so it's a fn. */
  buildFacts: (todayISO: string) => UserFacts;
}

/**
 * Judge's-choice synthetic notices. Dates are computed relative to "now" so the
 * countdown clock is always live and urgent on stage.
 *
 *  (a) clean not-at-fault SSDI overpayment    → waiver can cancel the debt
 *  (b) at-fault SSDI overpayment, can repay    → integrity routing (no waiver)
 *  (c) Ontario debt claim on time-barred debt  → THE CROSS-DOMAIN REVEAL
 *      (same engine, different country + injustice)
 */
export const SAMPLES: Sample[] = [
  {
    id: "ssdi-not-at-fault",
    packId: "benefits",
    title: "SSDI overpayment — not at fault",
    blurb:
      "SSA overpaid through its own error after the person reported their work. The waiver can cancel the debt entirely.",
    badge: "not-at-fault → waiver",
    tone: "primary",
    imagePath: "/samples/ssdi-not-at-fault.svg",
    buildExtraction: (todayISO) => ({
      domain: "benefits",
      issuer: "Social Security Administration",
      recipientName: "Jordan Rivera",
      claimType: "SSDI overpayment",
      amount: 9120,
      currency: "USD",
      noticeDate: addDays(todayISO, -21), // pause window ~9 days out → urgent clock
      serviceOrReceiptDate: null,
      rawDates: [{ label: "Notice date", dateISO: addDays(todayISO, -21) }],
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
    buildExtraction: (todayISO) => ({
      domain: "benefits",
      issuer: "Social Security Administration",
      recipientName: "Marcus Bell",
      claimType: "SSDI overpayment",
      amount: 9120,
      currency: "USD",
      noticeDate: addDays(todayISO, -21),
      serviceOrReceiptDate: null,
      rawDates: [{ label: "Notice date", dateISO: addDays(todayISO, -21) }],
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
  {
    id: "debt-time-barred",
    packId: "answer",
    title: "Debt lawsuit — Ontario, time-barred",
    blurb:
      "The SAME engine, a different country and injustice: a debt buyer sues on a 3-year-old debt. The 2-year limit can end the case.",
    badge: "cross-domain reveal",
    tone: "urgent",
    imagePath: "/samples/debt-claim-ontario.svg",
    buildExtraction: (todayISO) => ({
      domain: "answer",
      issuer: "Superior Court of Justice (Small Claims Court), Toronto",
      recipientName: "Priya Sharma",
      claimType: "credit-card debt claim",
      amount: 4380.55,
      currency: "CAD",
      noticeDate: null,
      serviceOrReceiptDate: addDays(todayISO, -15), // Defence due ~5 days out → urgent
      rawDates: [{ label: "Served", dateISO: addDays(todayISO, -15) }],
      partyOnOtherSide: "Velocity Receivables Inc. (assignee of original creditor)",
      identifiers: { claimNumber: "SC-24-0098765", court: "Toronto" },
      rawText:
        "SAMPLE — NOT A REAL NOTICE. Plaintiff's Claim (Form 7A). Velocity Receivables Inc. claims $4,380.55 plus interest and costs for an unpaid credit-card account assigned to it. You must file a Defence within 20 days or the plaintiff may obtain default judgment.",
      fieldConfidence: { issuer: 0.95, serviceOrReceiptDate: 0.93, amount: 0.94, claimType: 0.9 },
    }),
    buildFacts: (todayISO) => ({
      answers: {
        disputesDebt: true,
        plaintiffIsDebtBuyer: true,
        // Last payment ~3 years before service → past the 2-year limit → time-barred.
        lastActivityDate: addDays(todayISO, -1110),
        admitsOwes: false,
      },
    }),
  },
];

export function getSample(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}

/** Today's date as an ISO string, for sample date computation. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}
