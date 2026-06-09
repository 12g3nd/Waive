import type { DocumentSpec } from "@/engine";
import type { DebtJurisdiction } from "./jurisdictions";

/** Build the response-document template for a given jurisdiction (Defence/Reply/Answer). */
export function makeAnswerDocuments(j: DebtJurisdiction): DocumentSpec[] {
  const form = j.responseDoc.formNumber ? ` (${j.responseDoc.formNumber})` : "";
  return [
    {
      id: "response",
      title: `${j.responseDoc.name}${form} — ${j.court}`,
      formNumber: j.responseDoc.formNumber,
      description: `Your response to the claim. It states what you admit or deny, raises your defences, and — if you owe it — sets up affordable terms instead of a default judgment.`,
      sections: [
        {
          id: "parties-claim",
          heading: "Court, parties & claim number",
          guidance: `The court (${j.court}), the plaintiff's and your (defendant's) names, and the claim/case number from the claim you were served.`,
        },
        {
          id: "admit-deny",
          heading: "What you admit and what you deny",
          guidance:
            "State clearly which parts of the claim you admit and which you deny. If you dispute the debt, deny that you owe the amount and require the plaintiff to prove it.",
        },
        {
          id: "defences",
          heading: "Your defences",
          guidance: `Set out each defence with specific dates: that the claim is out of time under the ${j.limitationYears}-year limitation period; that the plaintiff (a debt buyer) must prove it owns the debt and the chain of ownership; that the amount is wrong or the debt is not yours.`,
        },
        {
          id: "if-you-owe",
          heading: "If you genuinely owe it",
          guidance:
            "Only if the debt is truly yours and in time — respond anyway so you don't lose by default, admit what you owe, and propose or negotiate a payment amount you can realistically afford.",
        },
        { id: "signature", heading: "Signature and date", guidance: "Sign and date your response." },
      ],
      filingChecklist: [
        {
          id: "file-on-time",
          text: `File within ${j.responseDays} days of being served, with the court that issued the claim.`,
          citationId: j.citations.deadline,
        },
        {
          id: "attach",
          text: "Attach a copy of any document your defence relies on (or state why it isn't attached).",
        },
        { id: "keep-copy", text: "Keep proof of filing and a complete copy of everything." },
        {
          id: "dont-miss",
          text: `Missing the ${j.responseDays}-day deadline lets the plaintiff take a default judgment — do not miss it.`,
          citationId: j.citations.default,
        },
      ],
      citationId: j.citations.responseForm,
    },
  ];
}
