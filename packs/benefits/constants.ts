/**
 * Citation ids for the `benefits` (SSA overpayment) pack.
 *
 * Each id resolves to an entry in /corpus/benefits.json. Using named constants
 * keeps the deterministic rules and the corpus in lockstep — a typo becomes a
 * compile error, and the pipeline surfaces any id missing from the corpus.
 */
export const CID = {
  /** 30-day protected pause: appeal/waiver within 30 days stops collection. */
  pause30: "ssa-30-day-pause",
  /** EM-25029 REV: 50% Title II default withholding begins at 90 days (eff 2025-04-25). */
  withhold90: "ssa-90-day-withholding-50",
  /** 60-day reconsideration deadline (20 CFR 404.909 + 404.901). */
  recon60: "ssa-recon-60-day",

  /** Remedies. */
  remedyRecon: "ssa-561-reconsideration",
  remedyWaiver: "ssa-632-waiver",
  remedyRate: "ssa-634-rate",
  remedyRepay: "ssa-repayment",

  /** Fault / without-fault standards. */
  faultStandard: "ssa-fault-standard",
  wf510g: "ssa-without-fault-510g", // reported change, payments continued
  wf510b: "ssa-without-fault-510b", // relied on official SSA misinformation
  wf510a: "ssa-without-fault-510a-net", // believed only net pay counted
  wf510h: "ssa-without-fault-510h-bonus", // unaware bonus/vacation counted
  wf510f: "ssa-without-fault-510f-retro", // retro raise / employer error / 5 paydays
  wf510k: "ssa-without-fault-510k-aux", // auxiliary unaware of primary's earnings
  wf510n: "ssa-without-fault-510n-general", // didn't understand provisions / unusual
  wfPandemic: "ssa-without-fault-pandemic", // COVID-period presumption
  substantiation: "ssa-substantiation", // SSA can't produce records (TODO_CITATION)

  /** Waiver second prong. */
  hardship: "ssa-hardship-defeat-purpose", // 20 CFR 404.508
  equity: "ssa-equity-good-conscience", // 20 CFR 404.509
} as const;

export type BenefitsCitationId = (typeof CID)[keyof typeof CID];

/** The date EM-25029's 50% Title II default withholding rule takes effect. */
export const FIFTY_PERCENT_EFFECTIVE_DATE = "2025-04-25";
