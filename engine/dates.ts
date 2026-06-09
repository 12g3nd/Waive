/**
 * Deterministic calendar math for deadline computation.
 *
 * Every function operates on date-only ISO strings ("YYYY-MM-DD") and computes in
 * UTC, so results never drift with the server's timezone or daylight-saving. These
 * are the "show your work" primitives — pack deadline rules are built from them and
 * are golden-tested, because a judge may ask exactly how a date was derived.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export class InvalidDateError extends Error {
  constructor(value: string) {
    super(`Invalid ISO date (expected YYYY-MM-DD): "${value}"`);
    this.name = "InvalidDateError";
  }
}

/** Parse a strict "YYYY-MM-DD" into a UTC Date at midnight. Throws on malformed input. */
export function fromISODate(iso: string): Date {
  const m = ISO_DATE_RE.exec(iso);
  if (!m) throw new InvalidDateError(iso);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new InvalidDateError(iso);
  const d = new Date(Date.UTC(year, month - 1, day));
  // Reject overflow like 2025-02-30 (which JS would roll forward).
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    throw new InvalidDateError(iso);
  }
  return d;
}

/** Format a Date as "YYYY-MM-DD" in UTC. */
export function toISODate(d: Date): string {
  const year = d.getUTCFullYear().toString().padStart(4, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns true if the string is a valid strict ISO date. */
export function isValidISODate(iso: string): boolean {
  try {
    fromISODate(iso);
    return true;
  } catch {
    return false;
  }
}

/** Add (or subtract, with a negative) calendar days. */
export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** 0 = Sunday … 6 = Saturday (UTC). */
export function dayOfWeek(iso: string): number {
  return fromISODate(iso).getUTCDay();
}

export function isWeekend(iso: string): boolean {
  const dow = dayOfWeek(iso);
  return dow === 0 || dow === 6;
}

export function isHoliday(iso: string, holidays: ReadonlySet<string>): boolean {
  return holidays.has(iso);
}

/** A day that is neither weekend nor in the holiday set. */
export function isBusinessDay(iso: string, holidays: ReadonlySet<string> = EMPTY): boolean {
  return !isWeekend(iso) && !isHoliday(iso, holidays);
}

const EMPTY: ReadonlySet<string> = new Set<string>();

/**
 * If `iso` falls on a weekend or holiday, roll forward to the next business day.
 * This is the standard "deadline lands on a Saturday → next business day" rule.
 * Returns the same date when it is already a business day.
 */
export function rollForwardToBusinessDay(
  iso: string,
  holidays: ReadonlySet<string> = EMPTY,
): string {
  let cur = iso;
  // Bounded loop: at most a handful of steps across a holiday weekend.
  for (let i = 0; i < 14; i++) {
    if (isBusinessDay(cur, holidays)) return cur;
    cur = addDays(cur, 1);
  }
  return cur;
}

/** Whole-day difference b - a (positive when b is after a). */
export function diffDays(aISO: string, bISO: string): number {
  const a = fromISODate(aISO).getTime();
  const b = fromISODate(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Days from `now` until `targetISO`; negative if the target has already passed. */
export function daysUntil(targetISO: string, now: Date): number {
  return diffDays(toISODate(now), targetISO);
}

/**
 * Format a Date as "YYYY-MM-DD" using the viewer's LOCAL calendar, not UTC.
 *
 * Deadlines are timezone-free calendar dates. A live "days left" countdown must be
 * measured against the viewer's own wall-clock date — measuring against the UTC date
 * makes the count jump a day early every evening for anyone west of UTC (i.e. all of
 * the Americas, the whole target audience). See `daysUntilLocal`.
 */
export function toLocalISODate(d: Date): string {
  const year = d.getFullYear().toString().padStart(4, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Whole days from the viewer's local "today" until `targetISO`; negative if passed.
 * Use this for the live UI countdown so the number matches the user's wall calendar.
 */
export function daysUntilLocal(targetISO: string, now: Date = new Date()): number {
  return diffDays(toLocalISODate(now), targetISO);
}

/** Human-readable date, e.g. "April 25, 2025". Deterministic, locale-independent. */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function humanDate(iso: string): string {
  const d = fromISODate(iso);
  const month = MONTHS[d.getUTCMonth()];
  return `${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
