import type { RulePack } from "@/engine";
import { ACID } from "./constants";
import { answerDocuments } from "./documents";
import { computeAnswerDeadlines } from "./deadlines";
import { checkAnswerDefenses } from "./defenses";
import { answerIntake } from "./intake";
import { routeAnswerRemedy } from "./router";

/**
 * The `answer` rule pack — Ontario debt-collection claims. Built thin on purpose:
 * it proves the engine is domain-blind by running a different country and a
 * different injustice through the exact same pipeline, with no engine changes.
 */
export const answerPack: RulePack = {
  id: "answer",
  displayName: "Debt Claim (Ontario)",
  jurisdiction: "ON-CA",
  computeDeadlines: computeAnswerDeadlines,
  routeRemedy: routeAnswerRemedy,
  checkPresumptions: checkAnswerDefenses,
  intake: answerIntake,
  documents: answerDocuments,
  citationIndex: Object.values(ACID),
};

export { ACID as answerCitationIds } from "./constants";
