import {
  fromISODate,
  isValidISODate,
  toISODate,
  type NoticeExtraction,
  type PresumptionResult,
  type UserFacts,
} from "@/engine";
import { ACID, ONTARIO_LIMITATION_YEARS } from "./constants";

function addYears(iso: string, years: number): string {
  const d = fromISODate(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return toISODate(d);
}

function str(f: UserFacts, key: string): string | undefined {
  const v = f.answers[key];
  return typeof v === "string" ? v : undefined;
}

const DEBT_BUYER_HINT = /(receivabl|recovery|recoveries|acquisition|asset|capital|portfolio|collection|midland|velocity|cavalry|encore|lvnv|hoyt|jefferson)/i;

/**
 * Deterministic defence detection for an Ontario debt claim — the `answer` pack's
 * equivalent of the benefits "gotcha engine". Each fired defence is a real reason
 * the case might be dismissed or the plaintiff put to proof, mapped to a citation.
 */
export function checkAnswerDefenses(
  e: NoticeExtraction,
  f: UserFacts,
): PresumptionResult {
  const catches: PresumptionResult["catches"] = [];

  // 1. Time-barred (the strongest debt defence).
  const last = str(f, "lastActivityDate");
  const claimDate = e.serviceOrReceiptDate ?? e.noticeDate;
  if (last && isValidISODate(last) && claimDate && isValidISODate(claimDate)) {
    const expiry = addYears(last, ONTARIO_LIMITATION_YEARS);
    if (claimDate > expiry) {
      catches.push({
        id: "time-barred",
        headline: "This debt may be too old to be legally enforceable.",
        explanation: `Ontario's basic limitation period is ${ONTARIO_LIMITATION_YEARS} years. The last activity you reported was ${last}, so the limitation period appears to have expired on ${expiry} — before this claim. Raising the limitation period as a defence can get the case dismissed.`,
        citationId: ACID.limitation,
        strength: "automatic",
      });
    }
  } else if (claimDate) {
    catches.push({
      id: "check-limitation",
      headline: "Check the dates — this debt may be too old to enforce.",
      explanation:
        "Ontario debts are usually unenforceable about 2 years after the last payment or written acknowledgment. Find that date — if it's more than 2 years before you were sued, you may have a complete defence. A written acknowledgment can restart the clock.",
      citationId: ACID.acknowledgment,
      strength: "possible",
    });
  }

  // 2. Debt-buyer standing — make them prove they own the debt.
  const plaintiff = e.partyOnOtherSide ?? "";
  const isBuyer = f.answers["plaintiffIsDebtBuyer"] === true || DEBT_BUYER_HINT.test(plaintiff);
  if (isBuyer) {
    catches.push({
      id: "debt-buyer-standing",
      headline: "Make the debt buyer prove it actually owns this debt.",
      explanation:
        "The plaintiff looks like a debt buyer, not your original creditor. It must prove the debt was properly assigned to it and show the chain of ownership. Put it to strict proof — gaps in the paperwork are a real defence.",
      citationId: ACID.standing,
      strength: "likely",
    });
  }

  // 3. General denial / not yours / already paid.
  if (f.answers["disputesDebt"] === true) {
    catches.push({
      id: "general-denial",
      headline: "You can deny the debt and require strict proof of every part.",
      explanation:
        "If the amount is wrong, the debt isn't yours, or you already paid it, your Defence can deny the claim and require the plaintiff to prove the agreement, the amount, and that you owe it.",
      citationId: ACID.defenceForm,
      strength: "possible",
    });
  }

  return { catches };
}

/** Routing helper: a strong (automatic/likely) defence is present. */
export function hasStrongDefence(result: PresumptionResult): boolean {
  return result.catches.some((c) => c.strength === "automatic" || c.strength === "likely");
}
