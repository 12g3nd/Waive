/**
 * Backstop engine — domain-blind type system.
 *
 * The interfaces in §"Spec interfaces" are implemented EXACTLY as given in the
 * build spec. Everything below that (pipeline result, ports, confidence) is the
 * engine's own machinery and is intentionally free of any domain knowledge.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Spec interfaces (implement exactly this shape)
// ─────────────────────────────────────────────────────────────────────────────

/** The domain-blind extraction every pack maps a raw notice into. */
export interface NoticeExtraction {
  domain: string; // "benefits" | "answer" | ...
  issuer: string; // e.g. "Social Security Administration", court name
  recipientName: string | null;
  claimType: string; // e.g. "SSDI overpayment", "credit-card debt"
  amount: number | null;
  currency: string; // default "USD"
  noticeDate: string | null; // ISO; the trigger date for the clock
  serviceOrReceiptDate: string | null;
  rawDates: { label: string; dateISO: string }[];
  partyOnOtherSide: string | null; // plaintiff / agency unit
  identifiers: Record<string, string>; // case no., SSN-last4 (redacted), claim id
  rawText: string; // OCR/vision text for audit
  fieldConfidence: Record<string, number>; // 0..1 per field
}

/** Collected via a short guided intake, per pack. */
export interface UserFacts {
  answers: Record<string, string | boolean | number>;
}

export interface DeadlineResult {
  deadlines: {
    id: string;
    label: string;
    dateISO: string;
    rule: string; // human-readable derivation, shown in the UI ("show your work")
    citationId: string;
    protected?: boolean;
  }[];
  primaryDeadlineId: string;
  pauseWindow?: { dateISO: string; description: string; citationId: string };
}

export interface RemedyDecision {
  selected: { id: string; label: string; why: string; citationId: string };
  alternatives: { id: string; label: string; whyNot: string; citationId: string }[];
  documentId: string; // which DocumentSpec to draft
  integrityNote?: string; // e.g. "you appear to owe this; not routing to a waiver"
}

export interface PresumptionResult {
  // a "catch" is the gotcha: "you are presumed not at fault → debt can be cancelled"
  catches: {
    id: string;
    headline: string;
    explanation: string;
    citationId: string;
    strength: "automatic" | "likely" | "possible";
  }[];
}

export interface RulePack {
  id: string; // "benefits" | "answer"
  displayName: string;
  jurisdiction?: string; // e.g. "US-SSA", "ON-CA"
  // 1. deterministic deadline math from the notice
  computeDeadlines(e: NoticeExtraction): DeadlineResult;
  // 2. deterministic routing to the correct remedy
  routeRemedy(e: NoticeExtraction, f: UserFacts): RemedyDecision;
  // 3. deterministic "do you auto-qualify for the strong escape hatch?"
  checkPresumptions(e: NoticeExtraction, f: UserFacts): PresumptionResult;
  // 4. the guided questions to collect UserFacts (drives the intake UI)
  intake: IntakeQuestion[];
  // 5. document templates the LLM fills (id -> structured template spec)
  documents: DocumentSpec[];
  // 6. citation corpus IDs this pack relies on (must resolve in /corpus)
  citationIndex: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Supporting types referenced by the spec interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type IntakeQuestionType =
  | "boolean"
  | "single"
  | "text"
  | "number"
  | "date"
  | "currency";

export interface IntakeQuestion {
  id: string;
  prompt: string;
  help?: string;
  type: IntakeQuestionType;
  options?: { value: string; label: string }[]; // for "single"
  required?: boolean;
  /** Only show this question when another answer matches (simple conditional intake). */
  showIf?: { questionId: string; equals: string | number | boolean };
}

export interface DocumentSpec {
  id: string; // e.g. "ssa-632"
  title: string; // "SSA-632 — Request for Waiver of Overpayment Recovery"
  formNumber?: string;
  description: string;
  /** Structured sections the drafter fills. Legal content comes from deterministic results. */
  sections: DocumentSection[];
  filingChecklist: ChecklistItem[];
  citationId: string;
}

export interface DocumentSection {
  id: string;
  heading: string;
  /** What belongs here; the drafter fills from facts + deterministic outputs (no new legal claims). */
  guidance: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  citationId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Citation corpus (see /corpus/*.json and §8)
// ─────────────────────────────────────────────────────────────────────────────

export interface CitationEntry {
  id: string;
  domain: string;
  topic: string;
  summary: string; // paraphrased, our own words
  officialCitation: string; // real & verified, or "TODO_CITATION ..."
  sourceTitle: string;
  sourceUrl: string;
  /** Derived: false when officialCitation begins with TODO_CITATION. */
  verified: boolean;
}

export interface ResolvedCitation extends CitationEntry {
  /** Which rule outputs referenced this citation (for the citations panel). */
  usedFor: string[];
}

/** A citation id paired with the human context that referenced it. */
export interface CitationReference {
  id: string;
  usedFor: string; // e.g. "Appeal/waiver pause window", "Routed remedy: SSA-632"
}

/** Resolves citation ids to corpus entries. Implemented by an in-memory store. */
export interface CitationResolver {
  has(id: string): boolean;
  resolve(id: string): CitationEntry | undefined;
  resolveReferences(refs: ReadonlyArray<CitationReference>): ResolvedCitation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pack registry (lookup only; the engine never branches on pack id)
// ─────────────────────────────────────────────────────────────────────────────

export interface PackLookup {
  get(id: string): RulePack | undefined;
  require(id: string): RulePack;
  list(): RulePack[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM port — the only place the engine touches a model. Pure translator role.
// ─────────────────────────────────────────────────────────────────────────────

export type NoticeSource =
  | { kind: "image"; mediaType: string; dataBase64: string; filename?: string }
  | { kind: "pdf"; dataBase64: string; filename?: string };

export interface ExtractionRequest {
  packId: string;
  domainHint: string;
  source: NoticeSource;
}

export interface ExplainRequest {
  language: string; // "en" | "es"
  extraction: NoticeExtraction;
  deadlines: DeadlineResult;
  remedy: RemedyDecision;
  presumptions: PresumptionResult;
  pack: RulePack;
}

export interface DraftRequest {
  language: string;
  spec: DocumentSpec;
  extraction: NoticeExtraction;
  userFacts: UserFacts;
  deadlines: DeadlineResult;
  remedy: RemedyDecision;
  presumptions: PresumptionResult;
  pack: RulePack;
}

export interface PlainLanguageExplanation {
  language: string;
  whatThisIs: string;
  whatHappensIfIgnored: string;
  whatToDoNow: string;
  source: "llm" | "deterministic-fallback";
}

export interface TranslateRequest {
  language: string;
  /** Stable key -> already-vetted English display text. The model returns the same keys. */
  strings: Record<string, string>;
}

export interface DraftedSection {
  id: string;
  heading: string;
  content: string;
}

export interface DraftedDocument {
  documentId: string;
  title: string;
  formNumber?: string;
  coverExplanation: string;
  body: DraftedSection[];
  filingChecklist: ChecklistItem[];
  source: "llm" | "deterministic-fallback";
}

/**
 * The model boundary. An implementation may call a real model (Ollama) and is
 * REQUIRED to never introduce a legal claim that is not already present in the
 * deterministic inputs. The engine treats every method as fallible.
 */
export interface LlmPort {
  extract(req: ExtractionRequest, pack: RulePack): Promise<NoticeExtraction>;
  explain(req: ExplainRequest): Promise<PlainLanguageExplanation>;
  draft(req: DraftRequest): Promise<DraftedDocument>;
  /**
   * Translate a bag of already-vetted display strings into req.language, preserving
   * keys and every number/date/form/citation verbatim. Returns key -> translated;
   * callers fall back to the English source for any missing/blank key. Treated as
   * fallible (returns source text on failure) and a no-op for English.
   */
  translate(req: TranslateRequest): Promise<Record<string, string>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline input / output
// ─────────────────────────────────────────────────────────────────────────────

/** Either a raw notice to be extracted by the LLM, or a precomputed extraction. */
export type PipelineSource =
  | NoticeSource
  | { kind: "extraction"; extraction: NoticeExtraction };

export interface PipelineInput {
  packId: string;
  userFacts: UserFacts;
  source: PipelineSource;
  language?: string; // explanation/draft language; default "en"
}

export interface PipelineDeps {
  registry: PackLookup;
  llm: LlmPort;
  corpus: CitationResolver;
  /** Override "now" for deterministic tests of the countdown. */
  now?: Date;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceReport {
  overall: number; // 0..1
  level: ConfidenceLevel;
  lowConfidenceFields: string[];
  escalate: boolean;
  escalationReason?: string;
}

/** The fully assembled result the UI renders. */
export interface PipelineResult {
  packId: string;
  packDisplayName: string;
  domain: string;
  language: string;
  extraction: NoticeExtraction;
  deadlines: DeadlineResult;
  remedy: RemedyDecision;
  presumptions: PresumptionResult;
  explanation: PlainLanguageExplanation;
  draftedDocument: DraftedDocument;
  citations: ResolvedCitation[];
  confidence: ConfidenceReport;
  /** Whether the model was actually used, or the deterministic fallback. */
  usedModel: boolean;
  generatedAt: string; // ISO timestamp
}
