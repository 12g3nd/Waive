import {
  fromISODate,
  isValidISODate,
  toISODate,
  type NoticeExtraction,
  type PresumptionResult,
  type UserFacts,
} from "@/engine";
import type { DebtJurisdiction } from "./jurisdictions";

function addYears(iso: string, years: number): string {
  const d = fromISODate(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return toISODate(d);
}

function str(f: UserFacts, key: string): string | undefined {
  const v = f.answers[key];
  return typeof v === "string" ? v : undefined;
}

const DEBT_BUYER_HINT =
  /(receivabl|recovery|recoveries|acquisition|asset|capital|portfolio|purchas|collection|midland|velocity|cavalry|encore|lvnv|meridian|cascade)/i;

/**
 * Deterministic defence detection for a debt claim, parameterized by jurisdiction.
 * The strongest defence is the limitation period (which varies — ON/BC 2 years,
 * CA 4); each fired defence maps to that jurisdiction's verified citation.
 */
export function checkAnswerDefenses(
  e: NoticeExtraction,
  f: UserFacts,
  j: DebtJurisdiction,
): PresumptionResult {
  const catches: PresumptionResult["catches"] = [];

  // 1. Time-barred — the strongest debt defence.
  const last = str(f, "lastActivityDate");
  const claimDate = e.serviceOrReceiptDate ?? e.noticeDate;
  if (last && isValidISODate(last) && claimDate && isValidISODate(claimDate)) {
    const expiry = addYears(last, j.limitationYears);
    if (claimDate > expiry) {
      catches.push({
        id: "time-barred",
        headline: "This debt may be too old to be legally enforceable.",
        explanation: `In ${j.region}, the basic limitation period is ${j.limitationYears} years. The last activity you reported was ${last}, so the limitation period appears to have expired on ${expiry} — before this claim. Raising the limitation period as a defence can get the case dismissed.`,
        citationId: j.citations.limitation,
        strength: "automatic",
      });
    }
  } else if (claimDate) {
    catches.push({
      id: "check-limitation",
      headline: "Check the dates — this debt may be too old to enforce.",
      explanation: `Debts in ${j.region} are usually unenforceable about ${j.limitationYears} years after the last payment or written acknowledgment. Find that date — if it's more than ${j.limitationYears} years before you were sued, you may have a complete defence. A written acknowledgment can restart the clock.`,
      citationId: j.citations.acknowledgment,
      strength: "possible",
    });
  }

  // 2. Debt-buyer standing — make them prove they own the debt.
  const plaintiff = e.partyOnOtherSide ?? "";
  const isBuyer = f.answers["plaintiffIsDebtBuyer"] === true || DEBT_BUYER_HINT.test(plaintiff);
  if (isBuyer) {
    catches.push({
      id: "debt-buyer-standing",
      headline: j.standing.headline,
      explanation: j.standing.explanation,
      citationId: j.citations.standing,
      strength: "likely",
    });
  }

  // 3. General denial / not yours / already paid.
  if (f.answers["disputesDebt"] === true) {
    catches.push({
      id: "general-denial",
      headline: "You can deny the debt and require strict proof of every part.",
      explanation:
        "If the amount is wrong, the debt isn't yours, or you already paid it, your response can deny the claim and require the plaintiff to prove the agreement, the amount, and that you owe it.",
      citationId: j.citations.responseForm,
      strength: "possible",
    });
  }

  return { catches };
}

/** Routing helper: a strong (automatic/likely) defence is present. */
export function hasStrongDefence(result: PresumptionResult): boolean {
  return result.catches.some((c) => c.strength === "automatic" || c.strength === "likely");
}
