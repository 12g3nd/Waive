import type {
  ConfidenceLevel,
  ConfidenceReport,
  DeadlineResult,
  NoticeExtraction,
} from "./types";

const LOW_FIELD_THRESHOLD = 0.5;
const MEDIUM_OVERALL = 0.55;
const HIGH_OVERALL = 0.8;

function levelFor(overall: number): ConfidenceLevel {
  if (overall >= HIGH_OVERALL) return "high";
  if (overall >= MEDIUM_OVERALL) return "medium";
  return "low";
}

/**
 * Deterministically grade extraction quality and decide whether the case should
 * escalate to "have a legal-aid clinic review this".
 *
 * This stays domain-blind: it reasons only about per-field confidence and whether
 * any anchor date exists at all (without an anchor date, no pack can compute a
 * trustworthy clock). Domain-specific judgment calls (e.g. SSA hardship) are
 * surfaced by the pack itself, not here.
 */
export function assessConfidence(
  extraction: NoticeExtraction,
  deadlines: DeadlineResult,
): ConfidenceReport {
  const values = Object.values(extraction.fieldConfidence);
  const overall =
    values.length === 0
      ? 0.5 // no signal at all → treat as uncertain
      : values.reduce((a, b) => a + b, 0) / values.length;

  const lowConfidenceFields = Object.entries(extraction.fieldConfidence)
    .filter(([, v]) => v < LOW_FIELD_THRESHOLD)
    .map(([k]) => k)
    .sort();

  const hasAnchorDate =
    extraction.noticeDate !== null || extraction.serviceOrReceiptDate !== null;
  const hasDeadlines = deadlines.deadlines.length > 0;

  const reasons: string[] = [];
  if (overall < MEDIUM_OVERALL) {
    reasons.push("the notice was read with low overall confidence");
  }
  if (!hasAnchorDate) {
    reasons.push("no notice/service date could be found to start the clock");
  }
  if (!hasDeadlines) {
    reasons.push("no deadline could be computed");
  }

  const escalate = reasons.length > 0;

  return {
    overall: Number(overall.toFixed(3)),
    level: levelFor(overall),
    lowConfidenceFields,
    escalate,
    escalationReason: escalate
      ? `Have a legal-aid clinic review this: ${reasons.join("; ")}.`
      : undefined,
  };
}
