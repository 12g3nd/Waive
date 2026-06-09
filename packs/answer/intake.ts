import type { IntakeQuestion } from "@/engine";

export const answerIntake: IntakeQuestion[] = [
  {
    id: "disputesDebt",
    prompt: "Do you dispute this debt (wrong amount, not yours, or already paid)?",
    type: "boolean",
  },
  {
    id: "lastActivityDate",
    prompt: "When did you last make a payment on this debt, or last acknowledge it in writing?",
    help: "Your best estimate. In Ontario a debt is usually unenforceable about 2 years after this date.",
    type: "date",
  },
  {
    id: "plaintiffIsDebtBuyer",
    prompt: "Is the company suing you a debt collector or debt buyer, not the original lender?",
    type: "boolean",
  },
  {
    id: "admitsOwes",
    prompt: "Do you agree you owe this and just need affordable payment terms?",
    type: "boolean",
  },
  {
    id: "proposeMonthly",
    prompt: "If you admit it, how much could you pay per month?",
    help: "Used to prepare the proposed terms of payment. Optional.",
    type: "currency",
    required: false,
  },
];
