import type { NoticeExtraction, RemedyDecision, UserFacts } from "@/engine";
import type { DebtJurisdiction } from "./jurisdictions";
import { checkAnswerDefenses, hasStrongDefence } from "./defenses";

function docLabel(j: DebtJurisdiction): string {
  return `${j.responseDoc.name}${j.responseDoc.formNumber ? ` (${j.responseDoc.formNumber})` : ""}`;
}

/**
 * Routing for a debt claim, parameterized by jurisdiction. In every branch the
 * action is to respond on time; integrity is preserved — someone who genuinely owes
 * the debt is not handed a manufactured defence, but is shown how responding still
 * protects them from a default judgment.
 */
export function routeAnswerRemedy(
  e: NoticeExtraction,
  f: UserFacts,
  j: DebtJurisdiction,
): RemedyDecision {
  const defenses = checkAnswerDefenses(e, f, j);
  const strong = hasStrongDefence(defenses);
  const disputes = f.answers["disputesDebt"] === true;
  const admits = f.answers["admitsOwes"] === true;
  const doc = docLabel(j);

  const altDoNothing = {
    id: "do-nothing",
    label: "Do nothing",
    whyNot: `This is what the plaintiff is counting on — silence becomes a default judgment and then garnishment.`,
    citationId: j.citations.default,
  };
  const altSettle = {
    id: "settle",
    label: "Negotiate / settle with the plaintiff",
    whyNot:
      "Possible — but never acknowledge the debt in writing or pay before checking the limitation date, because that can restart the clock.",
    citationId: j.citations.acknowledgment,
  };

  if (strong || disputes) {
    return {
      selected: {
        id: "dispute",
        label: `Dispute the claim — file your ${doc}`,
        why: `You have real grounds to contest this — your ${j.responseDoc.name} denies the claim and raises your defences (such as the ${j.limitationYears}-year limitation period or putting a debt buyer to proof). Filing on time forces the merits to be heard instead of losing by default.`,
        citationId: j.citations.deadline,
      },
      alternatives: [altSettle, altDoNothing],
      documentId: "response",
    };
  }

  if (admits) {
    return {
      selected: {
        id: "admit-respond",
        label: `Respond and protect yourself — file your ${doc}`,
        why: `You agree you owe this, so we won't manufacture a defence. But filing your ${j.responseDoc.name} on time stops a harsh default judgment and lets you arrange terms you can manage.`,
        citationId: j.citations.responseForm,
      },
      alternatives: [altSettle, altDoNothing],
      documentId: "response",
      integrityNote:
        "You indicated you genuinely owe this debt, so Waive is not inventing a defence. The honest, protective move is to respond and arrange terms you can manage — which still avoids losing by default.",
    };
  }

  return {
    selected: {
      id: "preserve",
      label: `File your ${doc} to protect your rights`,
      why: `Even if you're not sure yet, filing your ${j.responseDoc.name} on time stops an automatic default judgment and keeps every option open while you get the dates checked and seek advice.`,
      citationId: j.citations.deadline,
    },
    alternatives: [altSettle, altDoNothing],
    documentId: "response",
  };
}
