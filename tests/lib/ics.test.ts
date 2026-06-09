import { describe, expect, it } from "vitest";
import { buildICS, buildDeadlineICS, type CalendarEvent } from "@/lib/calendar/ics";
import { benefitsPack } from "@/packs/benefits";
import type { NoticeExtraction, PipelineResult } from "@/engine";

const NOW = new Date("2026-06-09T12:00:00Z");

/** Calendar parsers re-join folded lines (CRLF + space); undo it before asserting on content. */
function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "");
}

describe("buildICS", () => {
  const base: CalendarEvent = {
    uid: "x@waive",
    dateISO: "2026-07-01",
    summary: "Deadline: file your response",
    description: "do it",
    remindersDaysBefore: [3, 1],
  };

  it("emits an all-day VEVENT with the exclusive next-day DTEND", () => {
    const ics = buildICS([base], { now: NOW });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTAMP:20260609T120000Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260701");
    expect(ics).toContain("DTEND;VALUE=DATE:20260702");
    expect(ics).toContain("SUMMARY:Deadline: file your response");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("\r\n"); // CRLF line endings
  });

  it("renders one VALARM per reminder offset", () => {
    const ics = buildICS([base], { now: NOW });
    expect(ics).toContain("TRIGGER:-P3D");
    expect(ics).toContain("TRIGGER:-P1D");
    expect((ics.match(/BEGIN:VALARM/g) ?? []).length).toBe(2);
  });

  it("drops non-positive reminder offsets", () => {
    const ics = buildICS([{ ...base, remindersDaysBefore: [0, -1, 2] }], { now: NOW });
    expect((ics.match(/BEGIN:VALARM/g) ?? []).length).toBe(1);
    expect(ics).toContain("TRIGGER:-P2D");
  });

  it("escapes ICS-special characters", () => {
    const ics = buildICS(
      [{ ...base, summary: "a; b, c\\ d", description: "line1\nline2", remindersDaysBefore: [] }],
      { now: NOW },
    );
    expect(ics).toContain("SUMMARY:a\\; b\\, c\\\\ d");
    expect(ics).toContain("DESCRIPTION:line1\\nline2");
  });
});

describe("buildDeadlineICS", () => {
  const extraction: NoticeExtraction = {
    domain: "benefits",
    issuer: "Social Security Administration",
    recipientName: "Jordan Rivera",
    claimType: "SSDI overpayment",
    amount: 9120,
    currency: "USD",
    noticeDate: "2026-05-19",
    serviceOrReceiptDate: null,
    rawDates: [],
    partyOnOtherSide: null,
    identifiers: {},
    rawText: "",
    fieldConfidence: { issuer: 0.9 },
  };

  function result(): PipelineResult {
    return {
      extraction,
      deadlines: benefitsPack.computeDeadlines(extraction),
    } as unknown as PipelineResult;
  }

  it("creates one event per computed deadline, with the disclaimer", () => {
    const r = result();
    const ics = buildDeadlineICS(r, NOW);
    const events = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(events).toBe(r.deadlines.deadlines.length);
    expect(events).toBeGreaterThan(0);
    expect(unfold(ics)).toContain("Information only — not legal advice");
  });

  it("gives the protected (act-now) deadline the earliest reminder", () => {
    const ics = buildDeadlineICS(result(), NOW);
    // pause30 is protected → 7-day reminder present somewhere in the calendar.
    expect(ics).toContain("TRIGGER:-P7D");
  });

  it("returns empty (no events) when there is no deadline", () => {
    const noDate: PipelineResult = {
      extraction: { ...extraction, noticeDate: null },
      deadlines: benefitsPack.computeDeadlines({ ...extraction, noticeDate: null }),
    } as unknown as PipelineResult;
    const ics = buildDeadlineICS(noDate, NOW);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
