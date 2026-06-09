import { assessConfidence } from "./confidence";
import type {
  CitationReference,
  DeadlineResult,
  NoticeExtraction,
  PipelineDeps,
  PipelineInput,
  PipelineResult,
  PresumptionResult,
  RemedyDecision,
  RulePack,
} from "./types";

/**
 * Backstop — the domain-blind pipeline.
 *
 * read → extract → deadline → presumption → route → draft → checklist, assembled
 * into a single Result. There is intentionally NOT ONE branch on pack id or domain
 * in this function: the pack supplies all the legal logic through the RulePack
 * interface, and the LLM only translates/drafts. Adding an injustice never touches
 * this file.
 */
export async function runPipeline(
  input: PipelineInput,
  deps: PipelineDeps,
): Promise<PipelineResult> {
  const pack = deps.registry.require(input.packId);
  const language = input.language ?? "en";

  // 1. EXTRACT — either reuse a precomputed extraction (offline / sample) or ask
  //    the model to read the uploaded notice into the schema.
  const { extraction, usedModel } = await obtainExtraction(input, pack, deps);

  // 2–4. DETERMINISTIC LEGAL CORE. Pure functions, fully testable, show their work.
  const deadlines = pack.computeDeadlines(extraction);
  const remedy = pack.routeRemedy(extraction, input.userFacts);
  const presumptions = pack.checkPresumptions(extraction, input.userFacts);

  // 5. CITATIONS — map every legal claim to a corpus entry, by exact id.
  const references = collectCitationReferences(deadlines, remedy, presumptions);
  const citations = deps.corpus.resolveReferences(references);

  // 6. CONFIDENCE / ESCALATION — deterministic grading of extraction quality.
  const confidence = assessConfidence(extraction, deadlines);

  // 7. LLM TRANSLATION LAYER — plain language + drafting, grounded in the above.
  const explanation = await deps.llm.explain({
    language,
    extraction,
    deadlines,
    remedy,
    presumptions,
    pack,
  });

  const spec = selectDocumentSpec(pack, remedy.documentId);
  const draftedDocument = await deps.llm.draft({
    language,
    spec,
    extraction,
    userFacts: input.userFacts,
    deadlines,
    remedy,
    presumptions,
    pack,
  });

  const generatedAt = (deps.now ?? new Date()).toISOString();

  return {
    packId: pack.id,
    packDisplayName: pack.displayName,
    domain: extraction.domain,
    language,
    extraction,
    deadlines,
    remedy,
    presumptions,
    explanation,
    draftedDocument,
    filing: spec.filing ?? null,
    citations,
    confidence,
    usedModel: usedModel || explanation.source === "llm" || draftedDocument.source === "llm",
    generatedAt,
  };
}

async function obtainExtraction(
  input: PipelineInput,
  pack: RulePack,
  deps: PipelineDeps,
): Promise<{ extraction: NoticeExtraction; usedModel: boolean }> {
  if (input.source.kind === "extraction") {
    return { extraction: input.source.extraction, usedModel: false };
  }
  const extraction = await deps.llm.extract(
    { packId: pack.id, domainHint: pack.id, source: input.source },
    pack,
  );
  return { extraction, usedModel: true };
}

function selectDocumentSpec(pack: RulePack, documentId: string) {
  const spec = pack.documents.find((d) => d.id === documentId);
  if (!spec) {
    throw new Error(
      `Rule pack "${pack.id}" routed to document "${documentId}" which is not in its documents list.`,
    );
  }
  return spec;
}

/** Gather every citation id referenced by the deterministic outputs, with context. */
function collectCitationReferences(
  deadlines: DeadlineResult,
  remedy: RemedyDecision,
  presumptions: PresumptionResult,
): CitationReference[] {
  const refs: CitationReference[] = [];

  for (const d of deadlines.deadlines) {
    refs.push({ id: d.citationId, usedFor: `Deadline: ${d.label}` });
  }
  if (deadlines.pauseWindow) {
    refs.push({
      id: deadlines.pauseWindow.citationId,
      usedFor: "Protected pause window",
    });
  }

  refs.push({ id: remedy.selected.citationId, usedFor: `Routed remedy: ${remedy.selected.label}` });
  for (const alt of remedy.alternatives) {
    refs.push({ id: alt.citationId, usedFor: `Alternative remedy: ${alt.label}` });
  }

  for (const c of presumptions.catches) {
    refs.push({ id: c.citationId, usedFor: `Presumption: ${c.headline}` });
  }

  return refs.filter((r) => r.id);
}
