/**
 * Court/statutory holiday sets (observed) per jurisdiction, for the demo years. If
 * a response deadline lands on a weekend or holiday it rolls to the next court day,
 * so the deadline engine needs the right calendar for each jurisdiction.
 */

export const ONTARIO_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  // 2025
  "2025-01-01", "2025-02-17", "2025-04-18", "2025-05-19", "2025-07-01",
  "2025-08-04", "2025-09-01", "2025-10-13", "2025-12-25", "2025-12-26",
  // 2026
  "2026-01-01", "2026-02-16", "2026-04-03", "2026-05-18", "2026-07-01",
  "2026-08-03", "2026-09-07", "2026-10-12", "2026-12-25", "2026-12-28",
]);

export const BC_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  // 2025 — BC statutory holidays
  "2025-01-01", // New Year's Day
  "2025-02-17", // Family Day (BC, 3rd Mon Feb)
  "2025-04-18", // Good Friday
  "2025-05-19", // Victoria Day
  "2025-07-01", // Canada Day
  "2025-08-04", // BC Day
  "2025-09-01", // Labour Day
  "2025-10-13", // Thanksgiving
  "2025-11-11", // Remembrance Day
  "2025-12-25", // Christmas
  // 2026
  "2026-01-01", "2026-02-16", "2026-04-03", "2026-05-18", "2026-07-01",
  "2026-08-03", "2026-09-07", "2026-10-12", "2026-11-11", "2026-12-25",
]);

export const CALIFORNIA_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  // 2025 — California judicial-branch holidays (observed)
  "2025-01-01", // New Year's Day
  "2025-01-20", // MLK Day
  "2025-02-12", // Lincoln's Birthday
  "2025-02-17", // Washington's Birthday
  "2025-03-31", // Cesar Chavez Day
  "2025-05-26", // Memorial Day
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-11-11", // Veterans Day
  "2025-11-27", // Thanksgiving
  "2025-11-28", // Day after Thanksgiving
  "2025-12-25", // Christmas
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-12", "2026-02-16", "2026-03-31",
  "2026-05-25", "2026-07-03", "2026-09-07", "2026-11-11", "2026-11-26",
  "2026-11-27", "2026-12-25",
]);
