import { DEBT_JURISDICTIONS } from "@/packs/answer";

/** One filing location (jurisdiction) within a notice type. */
export interface NoticeLocation {
  packId: string;
  label: string;
}

/**
 * A user-facing notice category for the upload picker. The high level is the "type"
 * (what happened to you); the optional locations are the jurisdictions under it. The
 * resulting `packId` is what routes to the right rule pack.
 */
export interface NoticeType {
  domain: string;
  label: string;
  /** "Common things to notice" shown in the hover tip. */
  tips: string[];
  /** Jurisdictions to choose from; empty when the type needs no location. */
  locations: NoticeLocation[];
  /** Set for single-location types (e.g. SSA is U.S. federal). */
  packId?: string;
}

/**
 * Build the picker's notice types. Locations come straight from the registered debt
 * jurisdictions, so adding a province/state flows through automatically.
 */
export function buildNoticeTypes(): NoticeType[] {
  return [
    {
      domain: "benefits",
      label: "Social Security overpayment",
      tips: [
        "The notice date — your deadlines are counted from it.",
        "The amount they say you were overpaid.",
        "Any mention of withholding part of your monthly benefit.",
        "A claim or notice number (often near the top).",
      ],
      locations: [],
      packId: "benefits",
    },
    {
      domain: "answer",
      label: "Debt lawsuit",
      tips: [
        "The date you were served — your deadline is counted from it.",
        "The plaintiff's name (a debt-buyer name is a strong sign).",
        "The court name and the claim/file number.",
        "The date of your last payment (it sets the limitation clock).",
      ],
      locations: DEBT_JURISDICTIONS.map((j) => ({ packId: j.packId, label: j.label })),
    },
  ];
}
