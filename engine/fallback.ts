import { humanDate } from "./dates";
import { formatMoney } from "./format";
import type {
  DeadlineResult,
  DraftedDocument,
  DraftedSection,
  DraftRequest,
  ExplainRequest,
  ExtractionRequest,
  LlmPort,
  PlainLanguageExplanation,
  PresumptionResult,
  RulePack,
} from "./types";

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

function primaryDeadline(deadlines: DeadlineResult) {
  return (
    deadlines.deadlines.find((d) => d.id === deadlines.primaryDeadlineId) ??
    deadlines.deadlines[0]
  );
}

function strongestCatch(presumptions: PresumptionResult) {
  const order = { automatic: 0, likely: 1, possible: 2 } as const;
  return [...presumptions.catches].sort(
    (a, b) => order[a.strength] - order[b.strength],
  )[0];
}

/**
 * Builds the plain-language explanation purely from the deterministic outputs.
 * Introduces NO new legal claim — it only restates what the rule engine already
 * concluded. This is the offline safety net and the grounding contract the real
 * model is also held to.
 */
export function buildExplanation(req: ExplainRequest): PlainLanguageExplanation {
  const { extraction, deadlines, remedy, presumptions, language } = req;

  const who = extraction.recipientName ? ` addressed to ${extraction.recipientName}` : "";
  const money =
    extraction.amount !== null
      ? ` It concerns ${formatMoney(extraction.amount, extraction.currency)}.`
      : "";
  const whatThisIs =
    `This is a ${extraction.claimType} notice from ${extraction.issuer}${who}.${money}` +
    ` It carries a deadline, and missing that deadline can cause you to lose automatically — without anyone reviewing whether it is fair.`;

  const primary = primaryDeadline(deadlines);
  const ignoredParts: string[] = [];
  if (primary) {
    ignoredParts.push(
      `If you do nothing, the key date is ${humanDate(primary.dateISO)} (${primary.label}).`,
    );
  }
  if (deadlines.pauseWindow) {
    ignoredParts.push(
      `Acting before ${humanDate(deadlines.pauseWindow.dateISO)} ${deadlines.pauseWindow.description}`,
    );
  }
  const otherDeadlines = deadlines.deadlines.filter((d) => d.id !== primary?.id);
  for (const d of otherDeadlines) {
    ignoredParts.push(`${d.label}: ${humanDate(d.dateISO)}.`);
  }
  const whatHappensIfIgnored =
    ignoredParts.join(" ") ||
    "We could not compute a deadline from this notice — have an advocate review it promptly.";

  const todoParts: string[] = [
    `Your routed path is "${remedy.selected.label}": ${remedy.selected.why}`,
  ];
  if (primary) {
    todoParts.push(`File before ${humanDate(primary.dateISO)}.`);
  }
  const topCatch = strongestCatch(presumptions);
  if (topCatch && topCatch.strength === "automatic") {
    todoParts.push(topCatch.headline);
  }
  if (remedy.integrityNote) {
    todoParts.push(remedy.integrityNote);
  }
  const whatToDoNow = todoParts.join(" ");

  const offlineNote =
    language !== "en"
      ? " (Offline mode: automatic translation is unavailable without the local model; showing English.)"
      : "";

  return {
    language,
    whatThisIs: whatThisIs + offlineNote,
    whatHappensIfIgnored,
    whatToDoNow,
    source: "deterministic-fallback",
  };
}

/**
 * Builds a structured draft of the routed document from the spec + facts. It is a
 * clearly-marked preparation document: known facts are filled in, and everything
 * that needs the person's own words is left as a guided prompt. No legal claim is
 * invented beyond what the deterministic results already established.
 */
export function buildDraft(req: DraftRequest): DraftedDocument {
  const { spec, extraction, deadlines, remedy, presumptions } = req;
  const primary = primaryDeadline(deadlines);

  const knownFacts: string[] = [];
  if (extraction.recipientName) knownFacts.push(`Name: ${extraction.recipientName}`);
  for (const [k, v] of Object.entries(extraction.identifiers)) {
    knownFacts.push(`${k}: ${v}`);
  }
  if (extraction.amount !== null) {
    knownFacts.push(`Amount in question: ${formatMoney(extraction.amount, extraction.currency)}`);
  }
  if (extraction.partyOnOtherSide) knownFacts.push(`Other side: ${extraction.partyOnOtherSide}`);
  if (primary) knownFacts.push(`File by: ${humanDate(primary.dateISO)}`);

  const coverExplanation =
    `Draft of ${spec.title}. ${spec.description} ` +
    `This is a preparation document, not legal advice — review every field, fill in the prompts in your own words, and file before the deadline. ` +
    (knownFacts.length ? `Prepared from your notice — ${knownFacts.join("; ")}.` : "");

  const supportingCatches = presumptions.catches
    .map((c) => `• ${c.headline} — ${c.explanation}`)
    .join("\n");

  const body: DraftedSection[] = spec.sections.map((section) => {
    let content = section.guidance;
    // Attach the deterministic grounds where a section is about the legal basis.
    if (supportingCatches && /reason|basis|fault|defen|ground|statement/i.test(section.heading)) {
      content += `\n\nGrounds established from your facts:\n${supportingCatches}`;
    }
    content += `\n\n[Write your details here in your own words.]`;
    return { id: section.id, heading: section.heading, content };
  });

  return {
    documentId: spec.id,
    title: spec.title,
    formNumber: spec.formNumber,
    coverExplanation,
    body,
    filingChecklist: spec.filingChecklist,
    source: "deterministic-fallback",
  };
}

/**
 * LlmPort implementation that uses no model at all. Drives the fully-offline demo
 * path and is the fallback the real Ollama client delegates to when a call fails.
 * `extract` is impossible without a model, so it throws — the pipeline only calls
 * it for raw image/PDF sources, never for precomputed sample extractions.
 */
export class DeterministicFallbackLlm implements LlmPort {
  constructor(private readonly offlineReason: "forced" | "unreachable" = "unreachable") {}

  async extract(_req: ExtractionRequest, _pack: RulePack): Promise<never> {
    const message =
      this.offlineReason === "forced"
        ? "Live document reading is not available in this deployment. Try one of the sample notices below — they run fully offline."
        : "Ollama is not running — live document reading requires a local model. Run `ollama serve` and pull a model (e.g. `ollama pull llama3.2`), then try again. Or try a sample notice below.";
    throw new LlmUnavailableError(message);
  }

  async explain(req: ExplainRequest): Promise<PlainLanguageExplanation> {
    return buildExplanation(req);
  }

  async draft(req: DraftRequest): Promise<DraftedDocument> {
    return buildDraft(req);
  }
}
