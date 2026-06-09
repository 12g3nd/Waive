import type { DocumentSpec } from "@/engine";
import { CID } from "./constants";

const identification = {
  id: "identification",
  heading: "Identification",
  guidance:
    "Your full legal name, Social Security number, and the claim/notice number printed on your overpayment letter.",
};

const incomeExpenses = {
  id: "income-expenses",
  heading: "Your income, expenses, and assets",
  guidance:
    "List your monthly income, your necessary monthly expenses (rent/mortgage, food, utilities, medical, transportation), and your assets. SSA uses these to weigh hardship. Waive fills in the figures you gave during intake — review them and correct anything.",
};

const signature = {
  id: "certification",
  heading: "Signature and date",
  guidance:
    "Sign and date the form. You are certifying that the information is true to the best of your knowledge.",
};

/**
 * Structured templates for the SSA forms (plus an honest repayment guide). The
 * drafter fills these from facts + deterministic results; it never invents legal
 * content. Form numbers and the filing channel are real and verified in /corpus.
 */
export const benefitsDocuments: DocumentSpec[] = [
  {
    id: "ssa-632",
    title: "SSA-632 — Request for Waiver of Overpayment Recovery",
    formNumber: "SSA-632-BK",
    description:
      "Asks SSA to cancel the overpayment because you were not at fault and repayment would cause hardship or be unfair.",
    sections: [
      identification,
      {
        id: "not-at-fault",
        heading: "Why you were not at fault",
        guidance:
          "Explain, in your own words, the circumstances showing you did not cause the overpayment (for example: you reported the change and SSA kept paying you; you relied on what SSA told you). Attach proof — letters, pay records, dates.",
      },
      {
        id: "hardship-equity",
        heading: "Why you cannot repay / why repayment would be unfair",
        guidance:
          "Explain why repaying would leave you unable to meet ordinary living expenses, or why recovery would be against equity and good conscience (you relied on the money and changed your situation).",
      },
      incomeExpenses,
      signature,
    ],
    filingChecklist: [
      {
        id: "attach-proof",
        text: "Attach proof for the not-at-fault and hardship sections (pay records, SSA letters, bills).",
      },
      {
        id: "submit",
        text: "Submit to your local Social Security office — in person, by mail, or by fax. Find it at ssa.gov/locator or call 1-800-772-1213 (TTY 1-800-325-0778).",
        citationId: CID.remedyWaiver,
      },
      {
        id: "keep-copy",
        text: "Keep a complete copy of everything you file, and write down the date you filed it.",
      },
      {
        id: "also-561",
        text: "If you also dispute the amount, file Form SSA-561 (reconsideration) as well.",
        citationId: CID.remedyRecon,
      },
      {
        id: "no-fee",
        text: "There is no fee — filing a waiver or appeal with SSA is always free.",
      },
    ],
    citationId: CID.remedyWaiver,
  },
  {
    id: "ssa-634",
    title: "SSA-634 — Request for Change in Overpayment Recovery Rate",
    formNumber: "SSA-634",
    description:
      "Asks SSA to withhold a smaller, affordable amount each month instead of the default rate.",
    sections: [
      identification,
      {
        id: "proposed-rate",
        heading: "The monthly amount you can afford",
        guidance:
          "State the smaller monthly amount you can manage, and explain why the default withholding is too much given your income and expenses.",
      },
      incomeExpenses,
      signature,
    ],
    filingChecklist: [
      {
        id: "attach-proof",
        text: "Attach proof of your income and necessary expenses.",
      },
      {
        id: "submit",
        text: "Submit to your local Social Security office, by mail, or by fax (ssa.gov/locator; 1-800-772-1213).",
        citationId: CID.remedyRate,
      },
      { id: "keep-copy", text: "Keep a copy and note the date you filed." },
      {
        id: "no-fee",
        text: "There is no fee to ask SSA to lower your monthly withholding.",
      },
    ],
    citationId: CID.remedyRate,
  },
  {
    id: "ssa-561",
    title: "SSA-561 — Request for Reconsideration",
    formNumber: "SSA-561-U2",
    description:
      "Formally disputes that you were overpaid, or the amount SSA says you owe.",
    sections: [
      identification,
      {
        id: "what-you-dispute",
        heading: "What you disagree with and why",
        guidance:
          "Identify the overpayment determination and explain why you believe you were not overpaid, or why the amount is wrong (for example, SSA cannot show how it calculated it).",
      },
      {
        id: "evidence",
        heading: "Your evidence",
        guidance:
          "List and attach documents that support you — pay records, bank statements, prior SSA letters, dates of any reports you made.",
      },
      signature,
    ],
    filingChecklist: [
      {
        id: "deadline",
        text: "File within 60 days of receiving the notice (SSA presumes receipt 5 days after the notice date). Filing inside the 30-day protected window also freezes collection.",
        citationId: CID.recon60,
      },
      {
        id: "submit",
        text: "Submit to your local Social Security office, by mail, or online where available (ssa.gov/locator; 1-800-772-1213).",
        citationId: CID.remedyRecon,
      },
      { id: "keep-copy", text: "Keep a copy and note the date you filed." },
      {
        id: "no-fee",
        text: "There is no fee to file a reconsideration, and you can file it online at ssa.gov.",
      },
    ],
    citationId: CID.remedyRecon,
  },
  {
    id: "repayment",
    title: "Repayment / installment arrangement",
    description:
      "How to repay the overpayment or set up an affordable installment plan. This is guidance, not an SSA form.",
    sections: [
      {
        id: "how-to-pay",
        heading: "Ways to pay",
        guidance:
          "You can pay online at pay.gov (search 'SSA overpayment'), through your personal my Social Security account, or by check to SSA. Always reference your claim/notice number.",
      },
      {
        id: "installments",
        heading: "Requesting an installment plan",
        guidance:
          "If you cannot pay all at once, call SSA at 1-800-772-1213 or visit your local office to request a monthly installment plan you can manage.",
      },
      {
        id: "if-things-change",
        heading: "If your situation changes",
        guidance:
          "If you later cannot afford the payments, file SSA-634 to lower the rate. If you learn you were not at fault, file SSA-632 to seek a waiver that can cancel the debt.",
      },
    ],
    filingChecklist: [
      {
        id: "reference-number",
        text: "Reference your claim/notice number on every payment.",
        citationId: CID.remedyRepay,
      },
      { id: "confirmation", text: "Get and keep written confirmation of any plan you set up." },
      { id: "records", text: "Keep records of every payment you make." },
    ],
    citationId: CID.remedyRepay,
  },
];
