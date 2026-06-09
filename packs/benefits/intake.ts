import type { IntakeQuestion } from "@/engine";

/**
 * Guided intake for the SSA overpayment pack. These questions drive both the
 * not-at-fault presumption checker and the remedy router. They are written in
 * plain language; the heavy legal reasoning happens deterministically afterward.
 */
export const benefitsIntake: IntakeQuestion[] = [
  {
    id: "disputesOwes",
    prompt: "Do you disagree that you were overpaid, or believe the amount SSA claims is wrong?",
    help: "Pick yes if you think SSA's numbers are wrong or you weren't actually overpaid.",
    type: "boolean",
  },
  {
    id: "timelyReported",
    prompt:
      "Did you report the change that caused this (work, income, marriage, etc.) to SSA, but your benefits kept coming at the same amount?",
    help: "This is one of the strongest 'not at fault' situations.",
    type: "boolean",
  },
  {
    id: "reliedOnSsaInfo",
    prompt:
      "Did someone at Social Security (or another government office) tell you something that led to this overpayment?",
    type: "boolean",
  },
  {
    id: "ssaCannotProduceDocs",
    prompt:
      "Has SSA been unable to clearly show you why you were overpaid or how it reached the amount?",
    type: "boolean",
  },
  {
    id: "netVsGross",
    prompt: "Did you believe that only your take-home (net) pay counted toward the earnings limit?",
    type: "boolean",
  },
  {
    id: "bonusVacation",
    prompt: "Were you unaware that a bonus, vacation pay, or severance counted as earnings?",
    type: "boolean",
  },
  {
    id: "retroOrEmployerError",
    prompt:
      "Did this happen because of a retroactive raise, an employer mistake, or an unexpected extra payday?",
    type: "boolean",
  },
  {
    id: "auxiliaryUnaware",
    prompt:
      "Do you receive benefits on someone else's record and didn't know their work caused this?",
    type: "boolean",
  },
  {
    id: "didNotUnderstand",
    prompt:
      "Given your circumstances, did you genuinely not understand the rule you're said to have broken?",
    help: "SSA must weigh your age, education, and any health or language limitations.",
    type: "boolean",
  },
  {
    id: "pandemicPeriod",
    prompt: "Did the overpayment happen during the COVID-19 period (roughly March 2020 – late 2024)?",
    type: "boolean",
  },
  {
    id: "canAfford",
    prompt:
      "Could you repay this — or afford SSA taking the default amount from each check — without struggling to pay for housing, food, utilities, or medical care?",
    type: "boolean",
  },
  {
    id: "monthlyBenefit",
    prompt: "What is your current monthly benefit amount?",
    help: "Used to prepare your forms. Optional.",
    type: "currency",
    required: false,
  },
  {
    id: "monthlyIncome",
    prompt: "About how much total income do you have each month?",
    help: "Used on the SSA-632/634 income section. Optional.",
    type: "currency",
    required: false,
  },
  {
    id: "monthlyExpenses",
    prompt: "About how much do your necessary monthly expenses come to?",
    help: "Used on the SSA-632/634 expense section. Optional.",
    type: "currency",
    required: false,
  },
];
