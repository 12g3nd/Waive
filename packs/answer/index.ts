import type { RulePack } from "@/engine";
import { makeAnswerDocuments } from "./documents";
import { computeAnswerDeadlines } from "./deadlines";
import { checkAnswerDefenses } from "./defenses";
import { answerIntake } from "./intake";
import { routeAnswerRemedy } from "./router";
import { DEBT_JURISDICTIONS, type DebtJurisdiction } from "./jurisdictions";

/**
 * Build a debt-claim RulePack from a jurisdiction profile. This is the scalability
 * story made literal: a new province or U.S. state is a new profile + verified
 * citations, then `makeDebtPack(profile)` — the engine never changes. The `answer`
 * domain stays "answer" across jurisdictions; only the pack (and its law) differ.
 */
export function makeDebtPack(j: DebtJurisdiction): RulePack {
  return {
    id: j.packId,
    displayName: `Debt Claim (${j.label})`,
    jurisdiction: `${j.country === "Canada" ? "CA" : "US"}-${j.id}`,
    computeDeadlines: (e) => computeAnswerDeadlines(e, j),
    routeRemedy: (e, f) => routeAnswerRemedy(e, f, j),
    checkPresumptions: (e, f) => checkAnswerDefenses(e, f, j),
    intake: answerIntake,
    documents: makeAnswerDocuments(j),
    citationIndex: Object.values(j.citations),
  };
}

/** One debt pack per supported jurisdiction (Ontario, British Columbia, California). */
export const answerPacks: RulePack[] = DEBT_JURISDICTIONS.map(makeDebtPack);

/** Ontario pack, kept as the canonical `answerPack` export for back-compat. */
export const answerPack: RulePack =
  answerPacks.find((p) => p.id === "answer-on") ?? answerPacks[0]!;

export { DEBT_JURISDICTIONS, jurisdictionByPackId } from "./jurisdictions";
export type { DebtJurisdiction } from "./jurisdictions";
