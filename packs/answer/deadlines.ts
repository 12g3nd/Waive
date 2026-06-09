import {
  addDays,
  humanDate,
  isValidISODate,
  rollForwardToBusinessDay,
  type DeadlineResult,
  type NoticeExtraction,
} from "@/engine";
import { ACID } from "./constants";
import { ONTARIO_HOLIDAYS } from "./holidays";

/**
 * Deterministic Defence-deadline math for Ontario Small Claims Court. The clock
 * runs from the date the Plaintiff's Claim was served: a Defence (Form 9A) is due
 * 20 days later, rolled to the next court day. Miss it and the plaintiff can take
 * default judgment.
 */
export function computeAnswerDeadlines(e: NoticeExtraction): DeadlineResult {
  const trigger = e.serviceOrReceiptDate ?? e.noticeDate;
  if (!trigger || !isValidISODate(trigger)) {
    return { deadlines: [], primaryDeadlineId: "" };
  }

  const raw = addDays(trigger, 20);
  const due = rollForwardToBusinessDay(raw, ONTARIO_HOLIDAYS);
  const triggerLabel = e.serviceOrReceiptDate ? "served" : "dated";

  const rule =
    `Plaintiff's Claim ${triggerLabel} ${humanDate(trigger)} + 20 days = ${humanDate(raw)}` +
    (raw === due ? "" : `, rolled to the next court day = ${humanDate(due)}`) +
    `. File your Defence (Form 9A) on or before this date or the plaintiff can note you in default (Rule 11).`;

  return {
    deadlines: [
      {
        id: "defence20",
        label: "File your Defence (Form 9A) by",
        dateISO: due,
        rule,
        citationId: ACID.defence20,
      },
    ],
    primaryDeadlineId: "defence20",
  };
}
