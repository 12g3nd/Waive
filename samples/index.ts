import { addDays, toISODate, type NoticeExtraction, type UserFacts } from "@/engine";

export interface Sample {
  id: string;
  packId: string;
  title: string;
  blurb: string;
  badge: string;
  /** Tailwind accent class for the badge, e.g. "safe" | "urgent" | "primary". */
  tone: "primary" | "urgent" | "highlight";
  /** Rendered notice image for the vision path (added in Phase 5). */
  imagePath?: string;
  /** Precomputed extraction (offline path) — dates are filled fresh per request. */
  buildExtraction: (todayISO: string) => NoticeExtraction;
  presetFacts: UserFacts;
}

/**
 * Judge's-choice synthetic notices. Dates are computed relative to "now" so the
 * countdown clock is always live and urgent on stage. The not-at-fault and
 * at-fault SSDI samples are the SAME notice — they differ only in the intake facts
 * that flip the not-at-fault presumption, so the contrast is crisp.
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
    presetFacts: {
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
    },
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
    presetFacts: {
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
    },
  },
];

export function getSample(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}

/** Today's date as an ISO string, for sample date computation. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}
