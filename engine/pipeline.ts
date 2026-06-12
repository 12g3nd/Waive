import { assessConfidence } from "./confidence";
import type {
  CitationReference,
  ConfidenceReport,
  DeadlineResult,
  DraftedDocument,
  LlmPort,
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

  // 8. LOCALIZE the remaining engine-authored display strings — remedy, deadlines,
  //    presumptions, the draft's headings/checklist, and the escalation note. The
  //    explanation and draft prose are already written in `language`; this covers the
  //    rest so the whole page reads in one language. English (or any failure) is a
  //    no-op that keeps the verified English text.
  const localized =
    language === "en"
      ? { remedy, deadlines, presumptions, confidence, draftedDocument }
      : await localizeResult(
          language,
          { remedy, deadlines, presumptions, confidence, draftedDocument },
          deps.llm,
        );

  const generatedAt = (deps.now ?? new Date()).toISOString();

  return {
    packId: pack.id,
    packDisplayName: pack.displayName,
    domain: extraction.domain,
    language,
    extraction,
    deadlines: localized.deadlines,
    remedy: localized.remedy,
    presumptions: localized.presumptions,
    explanation,
    draftedDocument: localized.draftedDocument,
    citations,
    confidence: localized.confidence,
    usedModel: usedModel || explanation.source === "llm" || draftedDocument.source === "llm",
    generatedAt,
  };
}

interface LocalizableParts {
  remedy: RemedyDecision;
  deadlines: DeadlineResult;
  presumptions: PresumptionResult;
  confidence: ConfidenceReport;
  draftedDocument: DraftedDocument;
}

/**
 * Run the engine-authored display strings (which are deterministic English from the
 * rule pack) through the model's translate boundary and stitch the translations back
 * in. Keyed so order can't scramble it; every value falls back to its English source,
 * so a partial or failed translation degrades to English rather than breaking. The
 * legal logic is untouched — only display text changes. Citations stay verbatim
 * (quoted sources), as does anything the translator leaves blank.
 */
async function localizeResult(
  language: string,
  parts: LocalizableParts,
  llm: LlmPort,
): Promise<LocalizableParts> {
  const { remedy, deadlines, presumptions, confidence, draftedDocument } = parts;

  const src: Record<string, string> = {};
  const put = (key: string, value?: string) => {
    if (value && value.trim()) src[key] = value;
  };

  put("r.label", remedy.selected.label);
  put("r.why", remedy.selected.why);
  put("r.note", remedy.integrityNote);
  remedy.alternatives.forEach((a, i) => {
    put(`r.alt.${i}.label`, a.label);
    put(`r.alt.${i}.whyNot`, a.whyNot);
  });
  deadlines.deadlines.forEach((d, i) => {
    put(`d.${i}.label`, d.label);
    put(`d.${i}.rule`, d.rule);
  });
  put("pause.desc", deadlines.pauseWindow?.description);
  presumptions.catches.forEach((c, i) => {
    put(`p.${i}.headline`, c.headline);
    put(`p.${i}.explanation`, c.explanation);
  });
  put("conf.reason", confidence.escalationReason);
  put("doc.title", draftedDocument.title);
  draftedDocument.body.forEach((s, i) => put(`doc.sec.${i}.heading`, s.heading));
  draftedDocument.filingChecklist.forEach((c, i) => put(`doc.chk.${i}.text`, c.text));

  if (Object.keys(src).length === 0) return parts;

  let out: Record<string, string>;
  try {
    out = await llm.translate({ language, strings: src });
  } catch {
    return parts; // translation failed → keep the verified English
  }
  const g = (key: string, fallback: string) => {
    const v = out[key];
    return typeof v === "string" && v.trim() ? v : fallback;
  };

  return {
    remedy: {
      ...remedy,
      selected: {
        ...remedy.selected,
        label: g("r.label", remedy.selected.label),
        why: g("r.why", remedy.selected.why),
      },
      integrityNote: remedy.integrityNote ? g("r.note", remedy.integrityNote) : remedy.integrityNote,
      alternatives: remedy.alternatives.map((a, i) => ({
        ...a,
        label: g(`r.alt.${i}.label`, a.label),
        whyNot: g(`r.alt.${i}.whyNot`, a.whyNot),
      })),
    },
    deadlines: {
      ...deadlines,
      deadlines: deadlines.deadlines.map((d, i) => ({
        ...d,
        label: g(`d.${i}.label`, d.label),
        rule: g(`d.${i}.rule`, d.rule),
      })),
      pauseWindow: deadlines.pauseWindow
        ? { ...deadlines.pauseWindow, description: g("pause.desc", deadlines.pauseWindow.description) }
        : deadlines.pauseWindow,
    },
    presumptions: {
      ...presumptions,
      catches: presumptions.catches.map((c, i) => ({
        ...c,
        headline: g(`p.${i}.headline`, c.headline),
        explanation: g(`p.${i}.explanation`, c.explanation),
      })),
    },
    confidence: {
      ...confidence,
      escalationReason: confidence.escalationReason
        ? g("conf.reason", confidence.escalationReason)
        : confidence.escalationReason,
    },
    draftedDocument: {
      ...draftedDocument,
      title: g("doc.title", draftedDocument.title),
      body: draftedDocument.body.map((s, i) => ({
        ...s,
        heading: g(`doc.sec.${i}.heading`, s.heading),
      })),
      filingChecklist: draftedDocument.filingChecklist.map((c, i) => ({
        ...c,
        text: g(`doc.chk.${i}.text`, c.text),
      })),
    },
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
