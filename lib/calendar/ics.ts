/**
 * iCalendar (.ics) generation for the computed deadlines.
 *
 * The whole product is about not losing by silence — so once the engine has the
 * exact deadline, the most on-mission thing we can do is let the person drop it into
 * their own calendar with reminders that fire BEFORE the clock runs out. This is a
 * pure, deterministic transform of `DeadlineResult` into RFC 5545 text; no network,
 * no model. The reminders are real VALARMs (7 / 3 / 1 days before), so the user's
 * calendar app nags them on its own.
 */
import { addDays } from "@/engine/dates";
import type { PipelineResult } from "@/engine";

const PRODID = "-//Waive//Deadline Reminders//EN";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** "YYYY-MM-DD" → "YYYYMMDD" for an all-day DATE value. */
function icsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** UTC timestamp "YYYYMMDDTHHMMSSZ" for DTSTAMP. */
function icsTimestamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape a value for an ICS TEXT field (RFC 5545 §3.3.11). */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold a content line to ≤75 chars per RFC 5545 §3.1 (continuation = CRLF + space).
 * Calendar parsers re-join folded lines, so this keeps long DESCRIPTIONs valid.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) {
    parts.push(` ${line.slice(i, i + 74)}`);
  }
  return parts.join("\r\n");
}

export interface CalendarEvent {
  uid: string;
  /** All-day date "YYYY-MM-DD". */
  dateISO: string;
  summary: string;
  description: string;
  /** Reminder offsets in whole days before the date (e.g. [7, 3, 1]). */
  remindersDaysBefore: number[];
}

/** Build a complete VCALENDAR document from all-day deadline events. */
export function buildICS(
  events: CalendarEvent[],
  opts?: { now?: Date; calendarName?: string },
): string {
  const dtstamp = icsTimestamp(opts?.now ?? new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (opts?.calendarName) lines.push(`X-WR-CALNAME:${escapeText(opts.calendarName)}`);

  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(ev.dateISO)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(ev.dateISO, 1))}`, // all-day end is exclusive
      `SUMMARY:${escapeText(ev.summary)}`,
      `DESCRIPTION:${escapeText(ev.description)}`,
      "TRANSP:TRANSPARENT",
    );
    for (const days of ev.remindersDaysBefore) {
      if (days <= 0) continue;
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(ev.summary)}`,
        `TRIGGER:-P${days}D`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

const DISCLAIMER =
  "Information only — not legal advice. If unsure, contact a legal-aid clinic.";

/**
 * Map a pipeline result's computed deadlines into a downloadable calendar. Protected
 * (act-now) deadlines get earlier reminders; informational dates get fewer.
 */
export function buildDeadlineICS(result: PipelineResult, now?: Date): string {
  const { extraction } = result;
  const events: CalendarEvent[] = result.deadlines.deadlines.map((d) => ({
    uid: `${d.id}-${icsDate(d.dateISO)}-waive@waive.app`,
    dateISO: d.dateISO,
    summary: `${d.protected ? "Deadline" : "Heads-up"}: ${d.label}`,
    description: [
      `${extraction.claimType} from ${extraction.issuer}.`,
      d.rule ? `How this date was set: ${d.rule}` : "",
      DISCLAIMER,
    ]
      .filter(Boolean)
      .join("\n\n"),
    remindersDaysBefore: d.protected ? [7, 3, 1] : [3, 1],
  }));

  return buildICS(events, { now, calendarName: "Waive deadlines" });
}
