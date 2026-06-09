import type { NoticeExtraction, RemedyDecision, UserFacts } from "@/engine";
import { ACID } from "./constants";
import { checkAnswerDefenses, hasStrongDefence } from "./defenses";

const altDoNothing = {
  id: "do-nothing",
  label: "Do nothing",
  whyNot: "This is exactly what the plaintiff is counting on — silence becomes a default judgment and then garnishment.",
  citationId: ACID.defaultJudgment,
};
const altSettle = {
  id: "settle",
  label: "Negotiate / settle with the plaintiff",
  whyNot:
    "Possible — but never acknowledge the debt in writing or pay before checking the limitation date, because that can restart the 2-year clock.",
  citationId: ACID.acknowledgment,
};

/**
 * Routing for an Ontario debt claim. In every branch the action is the same — file
 * a Defence within 20 days — but the posture differs, and integrity is preserved:
 * someone who genuinely owes the debt is not handed a manufactured defence; they
 * admit it and propose affordable terms, which still beats a default judgment.
 */
export function routeAnswerRemedy(
  e: NoticeExtraction,
  f: UserFacts,
): RemedyDecision {
  const defenses = checkAnswerDefenses(e, f);
  const strong = hasStrongDefence(defenses);
  const disputes = f.answers["disputesDebt"] === true;
  const admits = f.answers["admitsOwes"] === true;

  if (strong || disputes) {
    return {
      selected: {
        id: "dispute",
        label: "Dispute the claim — file a Defence (Form 9A)",
        why: "You have real grounds to contest this — your Defence denies the claim and raises your defences (such as the limitation period or putting a debt buyer to proof). Filing within 20 days forces the merits to be heard instead of losing by default.",
        citationId: ACID.defence20,
      },
      alternatives: [altSettle, altDoNothing],
      documentId: "defence",
    };
  }

  if (admits) {
    return {
      selected: {
        id: "admit-propose",
        label: "Admit the debt and propose affordable terms — Defence (Form 9A)",
        why: "You agree you owe this, so we won't manufacture a defence. But filing a Defence that admits the debt and proposes a monthly amount you can afford protects you from a harsh default judgment.",
        citationId: ACID.proposeTerms,
      },
      alternatives: [altSettle, altDoNothing],
      documentId: "defence",
      integrityNote:
        "You indicated you genuinely owe this debt, so Waive is not inventing a defence. The honest, protective move is to admit it and propose terms you can manage — which still avoids losing by default.",
    };
  }

  return {
    selected: {
      id: "preserve",
      label: "File a Defence to protect your rights — Form 9A",
      why: "Even if you're not sure yet, filing a Defence within 20 days stops an automatic default judgment and keeps every option open while you get the dates checked and seek advice.",
      citationId: ACID.defence20,
    },
    alternatives: [altSettle, altDoNothing],
    documentId: "defence",
  };
}
