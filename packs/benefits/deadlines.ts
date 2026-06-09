import {
  addDays,
  humanDate,
  isValidISODate,
  rollForwardToBusinessDay,
  type DeadlineResult,
  type NoticeExtraction,
} from "@/engine";
import { CID, FIFTY_PERCENT_EFFECTIVE_DATE } from "./constants";
import { US_FEDERAL_HOLIDAYS } from "./holidays";

/** Format a "+N days, rolled to business day" derivation string. */
function derive(noticeISO: string, days: number, rawISO: string, rolledISO: string): string {
  const base = `Notice dated ${humanDate(noticeISO)} + ${days} calendar days = ${humanDate(rawISO)}`;
  return rawISO === rolledISO
    ? base
    : `${base}, which falls on a weekend/holiday, so it rolls to the next business day = ${humanDate(rolledISO)}`;
}

/**
 * Deterministic SSA overpayment deadline math. Produces three dated events from
 * the notice date, each with a "show your work" derivation and a real citation:
 *
 *  1. 30-day protected pause (the urgent, primary clock) — file an appeal/waiver
 *     inside it and SSA cannot collect until it decides.
 *  2. 60-day reconsideration deadline (with the 5-day mailing presumption).
 *  3. 90-day default-withholding clock — for notices on/after 2025-04-25 this is
 *     when 50% of the monthly benefit starts being withheld (EM-25029 REV).
 *
 * With no notice date there is no trustworthy clock; we return no deadlines and the
 * engine escalates.
 */
export function computeBenefitsDeadlines(e: NoticeExtraction): DeadlineResult {
  const notice = e.noticeDate;
  if (!notice || !isValidISODate(notice)) {
    return { deadlines: [], primaryDeadlineId: "" };
  }

  const H = US_FEDERAL_HOLIDAYS;

  const pauseRaw = addDays(notice, 30);
  const pauseDue = rollForwardToBusinessDay(pauseRaw, H);

  const reconRaw = addDays(notice, 65); // 5-day mail presumption + 60 days
  const reconDue = rollForwardToBusinessDay(reconRaw, H);

  const withholdRaw = addDays(notice, 90);
  const withholdDue = rollForwardToBusinessDay(withholdRaw, H);

  const fiftyPctApplies = notice >= FIFTY_PERCENT_EFFECTIVE_DATE; // ISO YYYY-MM-DD compares lexically

  const withholdRule = fiftyPctApplies
    ? `${derive(notice, 90, withholdRaw, withholdDue)}. Because this notice is dated on or after ${humanDate(
        FIFTY_PERCENT_EFFECTIVE_DATE,
      )}, SSA's default is to withhold 50% of your monthly benefit on this date unless you have requested a lower rate (SSA-634), reconsideration (SSA-561), or a waiver (SSA-632) first (EM-25029 REV).`
    : `${derive(notice, 90, withholdRaw, withholdDue)}. The 50% default-withholding rule (EM-25029) applies to notices dated on or after ${humanDate(
        FIFTY_PERCENT_EFFECTIVE_DATE,
      )}; this notice is earlier, so confirm the recovery rate that applies.`;

  return {
    deadlines: [
      {
        id: "pause30",
        label: "Protected window — file an appeal or waiver to freeze collection",
        dateISO: pauseDue,
        rule: `${derive(notice, 30, pauseRaw, pauseDue)}. File a reconsideration (SSA-561) or waiver (SSA-632) on or before this date and SSA cannot collect anything until it decides.`,
        citationId: CID.pause30,
        protected: true,
      },
      {
        id: "recon60",
        label: "Deadline to formally dispute the overpayment (reconsideration)",
        dateISO: reconDue,
        rule: `Notice dated ${humanDate(
          notice,
        )}; receipt presumed 5 days later (20 CFR 404.901), + 60 days to request reconsideration (20 CFR 404.909) = ${humanDate(
          reconRaw,
        )}${reconRaw === reconDue ? "" : `, rolled to the next business day = ${humanDate(reconDue)}`}.`,
        citationId: CID.recon60,
        protected: false,
      },
      {
        id: "withhold90",
        label: fiftyPctApplies
          ? "50% of your monthly benefit starts being withheld"
          : "Benefit recovery may begin",
        dateISO: withholdDue,
        rule: withholdRule,
        citationId: CID.withhold90,
        protected: false,
      },
    ],
    primaryDeadlineId: "pause30",
    pauseWindow: {
      dateISO: pauseDue,
      description:
        "stops SSA from collecting anything until it decides your appeal or waiver.",
      citationId: CID.pause30,
    },
  };
}
