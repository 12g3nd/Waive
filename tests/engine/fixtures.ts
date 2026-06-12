import { addDays, rollForwardToBusinessDay } from "@/engine/dates";
import type {
  CitationEntry,
  DraftedDocument,
  DraftRequest,
  ExplainRequest,
  ExtractionRequest,
  LlmPort,
  NoticeExtraction,
  PlainLanguageExplanation,
  RulePack,
  TranslateRequest,
} from "@/engine";

/**
 * A tiny, made-up rule pack used only to prove the engine is domain-blind: it
 * exercises every RulePack method without referencing any real legal domain.
 */
export const fakePack: RulePack = {
  id: "fake",
  displayName: "Fake Pack",
  jurisdiction: "TEST",
  computeDeadlines(e: NoticeExtraction) {
    if (!e.noticeDate) {
      return { deadlines: [], primaryDeadlineId: "" };
    }
    const due = rollForwardToBusinessDay(addDays(e.noticeDate, 10));
    const pause = addDays(e.noticeDate, 5);
    return {
      deadlines: [
        {
          id: "respond",
          label: "Respond by",
          dateISO: due,
          rule: `notice date ${e.noticeDate} + 10 days, rolled to next business day = ${due}`,
          citationId: "fake-deadline",
          protected: true,
        },
      ],
      primaryDeadlineId: "respond",
      pauseWindow: {
        dateISO: pause,
        description: "pauses any action until a decision is made.",
        citationId: "fake-pause",
      },
    };
  },
  routeRemedy(_e, f) {
    const atFault = f.answers["atFault"] === true;
    return {
      selected: {
        id: atFault ? "pay" : "fight",
        label: atFault ? "Set up repayment" : "Dispute it",
        why: atFault ? "you indicated this is genuinely owed" : "you dispute this",
        citationId: "fake-remedy",
      },
      alternatives: [
        { id: "other", label: "Other path", whyNot: "not the best fit here", citationId: "fake-alt" },
      ],
      documentId: "fake-doc",
      integrityNote: atFault ? "you appear to owe this; routing to the honest path." : undefined,
    };
  },
  checkPresumptions(_e, f) {
    if (f.answers["flag"] === true) {
      return {
        catches: [
          {
            id: "flag-fired",
            headline: "A protective presumption applies.",
            explanation: "Your answers trigger a rule in your favor.",
            citationId: "fake-catch",
            strength: "automatic",
          },
        ],
      };
    }
    return { catches: [] };
  },
  intake: [
    { id: "flag", prompt: "Does the flag apply?", type: "boolean" },
    { id: "atFault", prompt: "Are you at fault?", type: "boolean" },
  ],
  documents: [
    {
      id: "fake-doc",
      title: "Fake Form — Test Document",
      formNumber: "FAKE-1",
      description: "A test document spec.",
      sections: [
        { id: "intro", heading: "Introduction", guidance: "State who you are." },
        { id: "grounds", heading: "Your statement of grounds", guidance: "Explain your basis." },
      ],
      filingChecklist: [
        { id: "c1", text: "Sign and date the form.", citationId: "fake-doc" },
        { id: "c2", text: "Keep a copy." },
      ],
      citationId: "fake-doc-cite",
    },
  ],
  citationIndex: [
    "fake-deadline",
    "fake-pause",
    "fake-remedy",
    "fake-alt",
    "fake-catch",
    "fake-doc-cite",
  ],
};

/** A pack whose router points at a non-existent document (for error-path testing). */
export const brokenPack: RulePack = {
  ...fakePack,
  id: "broken",
  routeRemedy(e, f) {
    return { ...fakePack.routeRemedy(e, f), documentId: "does-not-exist" };
  },
};

export const fakeCorpus: Array<Omit<CitationEntry, "verified">> = [
  mk("fake-deadline", "Deadline rule"),
  mk("fake-pause", "Pause window rule"),
  mk("fake-remedy", "Remedy rule"),
  mk("fake-alt", "Alternative remedy rule"),
  mk("fake-catch", "Presumption rule"),
  mk("fake-doc-cite", "Document basis"),
  { ...mk("fake-unverified", "Unverified rule"), officialCitation: "TODO_CITATION (pending)" },
];

function mk(id: string, topic: string): Omit<CitationEntry, "verified"> {
  return {
    id,
    domain: "test",
    topic,
    summary: `Paraphrased ${topic}.`,
    officialCitation: `TEST ${id}`,
    sourceTitle: "Test Source",
    sourceUrl: "https://example.test/" + id,
  };
}

export function highConfidenceExtraction(
  overrides: Partial<NoticeExtraction> = {},
): NoticeExtraction {
  return {
    domain: "test",
    issuer: "Test Issuer",
    recipientName: "Pat Doe",
    claimType: "test claim",
    amount: 1234.5,
    currency: "USD",
    noticeDate: "2025-04-25",
    serviceOrReceiptDate: null,
    rawDates: [{ label: "Notice date", dateISO: "2025-04-25" }],
    partyOnOtherSide: "Test Counterparty",
    identifiers: { caseNo: "TEST-001" },
    rawText: "SAMPLE notice text",
    fieldConfidence: { issuer: 0.95, noticeDate: 0.92, amount: 0.9, claimType: 0.88 },
    ...overrides,
  };
}

/** A fake LLM whose outputs are tagged source:"llm" so we can test the model path. */
export class FakeModelLlm implements LlmPort {
  async extract(_req: ExtractionRequest): Promise<NoticeExtraction> {
    return highConfidenceExtraction({ rawText: "extracted-by-fake-model" });
  }
  async explain(req: ExplainRequest): Promise<PlainLanguageExplanation> {
    return {
      language: req.language,
      whatThisIs: "model explanation",
      whatHappensIfIgnored: "model consequence",
      whatToDoNow: "model action",
      source: "llm",
    };
  }
  async draft(req: DraftRequest): Promise<DraftedDocument> {
    return {
      documentId: req.spec.id,
      title: req.spec.title,
      formNumber: req.spec.formNumber,
      coverExplanation: "model cover",
      body: req.spec.sections.map((s) => ({ id: s.id, heading: s.heading, content: "model content" })),
      filingChecklist: req.spec.filingChecklist,
      source: "llm",
    };
  }
  async translate(req: TranslateRequest): Promise<Record<string, string>> {
    // Tag each value so a test can prove the translate boundary ran and was applied.
    return Object.fromEntries(
      Object.entries(req.strings).map(([k, v]) => [k, `[${req.language}] ${v}`]),
    );
  }
}
