import type { NoticeExtraction, RemedyDecision, UserFacts } from "@/engine";
import { CID } from "./constants";
import { checkBenefitsPresumptions, hasStrongNotAtFault } from "./presumptions";

// Reusable alternative builders, so every alternative carries a real citation.
const altWaiver = (whyNot: string) => ({
  id: "waiver",
  label: "Waiver — Form SSA-632",
  whyNot,
  citationId: CID.remedyWaiver,
});
const altRate = (whyNot: string) => ({
  id: "rate",
  label: "Lower the rate — Form SSA-634",
  whyNot,
  citationId: CID.remedyRate,
});
const altRecon = (whyNot: string) => ({
  id: "reconsider",
  label: "Reconsideration — Form SSA-561",
  whyNot,
  citationId: CID.remedyRecon,
});
const altRepay = (whyNot: string) => ({
  id: "repay",
  label: "Repay / installment plan",
  whyNot,
  citationId: CID.remedyRepay,
});

/**
 * Deterministic remedy routing for SSA overpayments. Implements the §6 decision
 * tree with integrity built in: an at-fault person who can pay is NOT routed to a
 * frivolous waiver — they get the honest path and an explicit integrity note.
 *
 *  - Disputes the debt/amount            → SSA-561 (reconsideration)
 *  - Not at fault (strong presumption)   → SSA-632 (waiver — can cancel the debt)
 *  - At fault + can afford               → repay / installment plan (+ integrity note)
 *  - At fault + cannot afford (or unsure)→ SSA-634 (lower the withholding rate)
 */
export function routeBenefitsRemedy(
  e: NoticeExtraction,
  f: UserFacts,
): RemedyDecision {
  const disputes = f.answers["disputesOwes"] === true;
  const presumptions = checkBenefitsPresumptions(e, f);
  const notAtFault = hasStrongNotAtFault(presumptions);
  const canAfford = f.answers["canAfford"] === true;

  if (disputes) {
    return {
      selected: {
        id: "reconsider",
        label: "Appeal the overpayment — Form SSA-561 (Reconsideration)",
        why: "You dispute that you were overpaid or that the amount is right. Reconsideration asks SSA to review that determination — and filing within the protected window freezes collection until it decides.",
        citationId: CID.remedyRecon,
      },
      alternatives: [
        altWaiver(
          notAtFault
            ? "Your facts also suggest you were not at fault — once the amount is settled, a waiver could cancel any remaining debt. Consider filing both."
            : "Better fit if you agree you owe it but were not at fault; right now you dispute the amount itself.",
        ),
        altRate("Use this if you end up agreeing you owe it but cannot afford the withholding."),
      ],
      documentId: "ssa-561",
    };
  }

  if (notAtFault) {
    return {
      selected: {
        id: "waiver",
        label: "Request a waiver — Form SSA-632 (the debt can be cancelled)",
        why: "Your answers trigger a 'without fault' presumption, which unlocks a waiver that can cancel the debt entirely. Waive prepares the SSA-632 with your figures, but does not decide whether repayment causes you hardship — have a legal-aid clinic review that part.",
        citationId: CID.remedyWaiver,
      },
      alternatives: [
        altRate("If the waiver is denied, this lowers the monthly withholding to an amount you can manage."),
        altRecon("File this too if you also dispute that you were overpaid or the amount."),
      ],
      documentId: "ssa-632",
    };
  }

  // Appears at fault from here.
  if (canAfford) {
    return {
      selected: {
        id: "repay",
        label: "Repay or set up an installment plan",
        why: "Based on your answers, you likely caused this overpayment and can afford to repay it. The honest path is to repay or arrange a manageable installment plan.",
        citationId: CID.remedyRepay,
      },
      alternatives: [
        altRate("Use this instead if the default withholding is actually unaffordable."),
        altWaiver("A waiver needs you to be not at fault; your answers did not establish that. If they change, this could cancel the debt."),
      ],
      documentId: "repayment",
      integrityNote:
        "You appear to have caused this overpayment and can afford to repay it, so Waive is not routing you to a waiver — a waiver would likely be denied where the person is at fault. The honest path is to repay or set up an installment plan.",
    };
  }

  return {
    selected: {
      id: "rate",
      label: "Lower the monthly withholding — Form SSA-634",
      why: "You agree you owe this but cannot afford the default withholding. SSA-634 asks SSA to take a smaller, affordable amount each month instead of the default 50%.",
      citationId: CID.remedyRate,
    },
    alternatives: [
      altRepay("Use this if you can actually afford to repay; otherwise lowering the rate keeps more of each check."),
      altWaiver("A waiver needs you to be not at fault; your answers did not establish that. If they do, this could cancel the debt."),
    ],
    documentId: "ssa-634",
    integrityNote:
      f.answers["canAfford"] === false
        ? undefined
        : "You did not confirm you can afford repayment, so Waive routes you to the lower-rate request (SSA-634). If your facts show you were not at fault, the stronger waiver (SSA-632) may apply.",
  };
}
