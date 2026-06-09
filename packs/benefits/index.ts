import type { RulePack } from "@/engine";
import { CID } from "./constants";
import { benefitsDocuments } from "./documents";
import { computeBenefitsDeadlines } from "./deadlines";
import { benefitsIntake } from "./intake";
import { checkBenefitsPresumptions } from "./presumptions";
import { routeBenefitsRemedy } from "./router";

/**
 * The `benefits` rule pack — SSA overpayments. All legal logic is deterministic
 * and citation-tagged; the engine consumes it through the RulePack interface and
 * never knows it is Social Security.
 */
export const benefitsPack: RulePack = {
  id: "benefits",
  displayName: "SSA Overpayment",
  jurisdiction: "US-SSA",
  computeDeadlines: computeBenefitsDeadlines,
  routeRemedy: routeBenefitsRemedy,
  checkPresumptions: checkBenefitsPresumptions,
  intake: benefitsIntake,
  documents: benefitsDocuments,
  citationIndex: Object.values(CID),
};

export { CID as benefitsCitationIds } from "./constants";
