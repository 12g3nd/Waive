import { BC_HOLIDAYS, CALIFORNIA_HOLIDAYS, ONTARIO_HOLIDAYS, QUEBEC_HOLIDAYS } from "./holidays";

/**
 * A debt-claim jurisdiction profile. The whole `answer` pack is generated from one
 * of these — so adding a province or U.S. state is filling in this table (verified
 * citations included), not writing engine code. This is the scalability story made
 * literal: same engine, same UI, config per jurisdiction.
 */
export interface DebtJurisdiction {
  id: "ON" | "BC" | "CA" | "QC";
  packId: string; // "answer-on" | "answer-bc" | "answer-ca" | "answer-qc"
  label: string; // "Ontario"
  region: string; // "Ontario, Canada"
  country: "Canada" | "United States";
  court: string;
  responseDoc: { name: string; formNumber?: string }; // Defence / Reply / Answer
  responseDays: number;
  servedOutsideDays?: number;
  defaultConsequence: string; // what happens if you miss it
  limitationYears: number;
  currency: string;
  holidays: ReadonlySet<string>;
  citations: {
    deadline: string;
    default: string;
    limitation: string;
    acknowledgment: string;
    standing: string;
    responseForm: string;
  };
  /** Jurisdiction-specific "make them prove they own the debt" text. */
  standing: { headline: string; explanation: string };
  /** Demo sample parameters (plaintiff + amount + how far back to be time-barred). */
  sample: { plaintiff: string; amount: number; lastActivityDaysAgo: number; claimNo: string };
}

export const ONTARIO: DebtJurisdiction = {
  id: "ON",
  packId: "answer-on",
  label: "Ontario",
  region: "Ontario, Canada",
  country: "Canada",
  court: "Ontario Small Claims Court",
  responseDoc: { name: "Defence", formNumber: "Form 9A" },
  responseDays: 20,
  defaultConsequence: "note you in default and ask for a default judgment (Rule 11)",
  limitationYears: 2,
  currency: "CAD",
  holidays: ONTARIO_HOLIDAYS,
  citations: {
    deadline: "ans-defence-20-day",
    default: "ans-default-judgment",
    limitation: "ans-limitation-2yr",
    acknowledgment: "ans-acknowledgment",
    standing: "ans-assignment-standing",
    responseForm: "ans-defence-form-9a",
  },
  standing: {
    headline: "Make the debt buyer prove it actually owns this debt.",
    explanation:
      "The plaintiff looks like a debt buyer, not your original creditor. Under Ontario's assignment rules it must prove the debt was properly assigned to it, with notice and a clear chain of ownership. Put it to strict proof — gaps are a real defence.",
  },
  sample: { plaintiff: "Velocity Receivables Inc. (assignee of original creditor)", amount: 4380.55, lastActivityDaysAgo: 1110, claimNo: "SC-24-0098765" },
};

export const BRITISH_COLUMBIA: DebtJurisdiction = {
  id: "BC",
  packId: "answer-bc",
  label: "British Columbia",
  region: "British Columbia, Canada",
  country: "Canada",
  court: "Provincial Court of British Columbia (Small Claims)",
  responseDoc: { name: "Reply", formNumber: "Form 2" },
  responseDays: 14,
  servedOutsideDays: 30,
  defaultConsequence: "ask the registrar for a default order against you",
  limitationYears: 2,
  currency: "CAD",
  holidays: BC_HOLIDAYS,
  citations: {
    deadline: "ans-bc-reply-14-day",
    default: "ans-bc-default",
    limitation: "ans-bc-limitation",
    acknowledgment: "ans-bc-acknowledgment",
    standing: "ans-bc-standing",
    responseForm: "ans-bc-reply-form",
  },
  standing: {
    headline: "Make the debt buyer prove it actually owns this debt.",
    explanation:
      "The plaintiff looks like a debt buyer. Under BC's Law and Equity Act, an assignment must be absolute and in writing with notice to you to be enforceable by the assignee. Require strict proof of the assignment and the chain of ownership.",
  },
  sample: { plaintiff: "Cascade Asset Recovery Ltd. (debt purchaser)", amount: 3920.4, lastActivityDaysAgo: 1110, claimNo: "VIC-S-2024-7741" },
};

export const CALIFORNIA: DebtJurisdiction = {
  id: "CA",
  packId: "answer-ca",
  label: "California",
  region: "California, USA",
  country: "United States",
  court: "Superior Court of California",
  responseDoc: { name: "Answer", formNumber: "PLD-C-010" },
  responseDays: 30,
  defaultConsequence: "ask the court to enter your default and a default judgment (CCP § 585)",
  limitationYears: 4,
  currency: "USD",
  holidays: CALIFORNIA_HOLIDAYS,
  citations: {
    deadline: "ans-ca-response-30-day",
    default: "ans-ca-default",
    limitation: "ans-ca-limitation",
    acknowledgment: "ans-ca-acknowledgment",
    standing: "ans-ca-standing",
    responseForm: "ans-ca-answer-form",
  },
  standing: {
    headline: "Make the debt buyer prove it owns the debt — California law requires it.",
    explanation:
      "The plaintiff looks like a debt buyer. California's Fair Debt Buying Practices Act requires a debt buyer to actually possess proof it owns the debt — the charge-off balance, the default date, the original creditor, and account documentation. Demand it; without that proof the case can fail.",
  },
  sample: { plaintiff: "Meridian Portfolio Acquisitions LLC (debt buyer)", amount: 5215.0, lastActivityDaysAgo: 1850, claimNo: "37-2024-00098765-CL" },
};

export const QUEBEC: DebtJurisdiction = {
  id: "QC",
  packId: "answer-qc",
  label: "Quebec",
  region: "Quebec, Canada",
  country: "Canada",
  court: "Court of Québec (Civil Division)",
  responseDoc: { name: "Answer to summons" },
  responseDays: 15,
  defaultConsequence: "put you in default and ask the court for a judgment by default",
  limitationYears: 3,
  currency: "CAD",
  holidays: QUEBEC_HOLIDAYS,
  citations: {
    deadline: "ans-qc-answer-15-day",
    default: "ans-qc-default",
    limitation: "ans-qc-limitation",
    acknowledgment: "ans-qc-acknowledgment",
    standing: "ans-qc-standing",
    responseForm: "ans-qc-answer-form",
  },
  standing: {
    headline: "Make the debt buyer prove it actually owns this debt.",
    explanation:
      "The plaintiff looks like a debt buyer, not your original creditor. Under Quebec's rules on the assignment of claims, an assignment can be set up against you only once you have acquiesced to it or received it — so the plaintiff must prove a valid assignment and that you were notified. Put it to strict proof; gaps are a real defence.",
  },
  sample: { plaintiff: "Société de Recouvrement Boréal inc. (cessionnaire)", amount: 4120.75, lastActivityDaysAgo: 1500, claimNo: "QC-500-22-098765" },
};

export const DEBT_JURISDICTIONS: DebtJurisdiction[] = [ONTARIO, BRITISH_COLUMBIA, CALIFORNIA, QUEBEC];

export function jurisdictionByPackId(packId: string): DebtJurisdiction | undefined {
  return DEBT_JURISDICTIONS.find((j) => j.packId === packId);
}
