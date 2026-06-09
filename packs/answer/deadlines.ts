import {
  addDays,
  humanDate,
  isValidISODate,
  rollForwardToBusinessDay,
  type DeadlineResult,
  type NoticeExtraction,
} from "@/engine";
import type { DebtJurisdiction } from "./jurisdictions";

function docLabel(j: DebtJurisdiction): string {
  return `${j.responseDoc.name}${j.responseDoc.formNumber ? ` (${j.responseDoc.formNumber})` : ""}`;
}

/**
 * Deterministic response-deadline math for a debt claim, parameterized by
 * jurisdiction. The clock runs from the service date: a response is due
 * `responseDays` later, rolled to the next court day. Miss it and the plaintiff can
 * take a default judgment. Ontario = 20 days, BC = 14, California = 30 — same code.
 */
export function computeAnswerDeadlines(
  e: NoticeExtraction,
  j: DebtJurisdiction,
): DeadlineResult {
  const trigger = e.serviceOrReceiptDate ?? e.noticeDate;
  if (!trigger || !isValidISODate(trigger)) {
    return { deadlines: [], primaryDeadlineId: "" };
  }

  const raw = addDays(trigger, j.responseDays);
  const due = rollForwardToBusinessDay(raw, j.holidays);
  const triggerLabel = e.serviceOrReceiptDate ? "served" : "dated";

  const rule =
    `Claim ${triggerLabel} ${humanDate(trigger)} + ${j.responseDays} days = ${humanDate(raw)}` +
    (raw === due ? "" : `, rolled to the next court day = ${humanDate(due)}`) +
    `. File your ${docLabel(j)} on or before this date or the plaintiff can ${j.defaultConsequence}.`;

  return {
    deadlines: [
      {
        id: "response",
        label: `File your ${docLabel(j)} by`,
        dateISO: due,
        rule,
        citationId: j.citations.deadline,
      },
    ],
    primaryDeadlineId: "response",
  };
}
