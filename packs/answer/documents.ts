import type { DocumentSpec } from "@/engine";
import { ACID } from "./constants";

export const answerDocuments: DocumentSpec[] = [
  {
    id: "defence",
    title: "Defence (Form 9A) — Ontario Small Claims Court",
    formNumber: "Form 9A",
    description:
      "Your response to the Plaintiff's Claim. It states what you admit or deny, raises your defences, and — if you admit the debt — proposes terms of payment.",
    sections: [
      {
        id: "parties-claim",
        heading: "Court, parties & claim number",
        guidance:
          "The Small Claims Court location, the plaintiff's and your (defendant's) names, and the claim number from the Plaintiff's Claim (Form 7A).",
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
        guidance:
          "Set out each defence with specific dates: that the claim is out of time under Ontario's 2-year limitation period; that the plaintiff (a debt buyer) must prove it owns the debt and the chain of assignment; that the amount is wrong or the debt is not yours.",
      },
      {
        id: "terms-of-payment",
        heading: "If you admit it: proposed terms of payment",
        guidance:
          "Only if you genuinely owe the debt — admit it and propose a monthly amount you can realistically afford.",
      },
      {
        id: "signature",
        heading: "Signature and date",
        guidance: "Sign and date the Defence.",
      },
    ],
    filingChecklist: [
      {
        id: "file-20",
        text: "File within 20 days of being served, with the clerk of the same court that issued the claim.",
        citationId: ACID.defence20,
      },
      {
        id: "attach",
        text: "Attach a copy of any document your defence relies on (or state why it isn't attached).",
      },
      {
        id: "serve-keep",
        text: "Keep proof of filing and a complete copy of everything.",
      },
      {
        id: "dont-miss",
        text: "Missing the 20-day deadline lets the plaintiff take a default judgment — do not miss it.",
        citationId: ACID.defaultJudgment,
      },
    ],
    citationId: ACID.defenceForm,
  },
];
