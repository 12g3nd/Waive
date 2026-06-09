/**
 * Ontario statutory / court holidays (observed) for the demo years. Under the
 * Rules, if a Defence deadline lands on a holiday it moves to the next day that is
 * not a holiday, so the deadline engine rolls forward across these.
 */
export const ONTARIO_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  // 2025
  "2025-01-01", // New Year's Day
  "2025-02-17", // Family Day
  "2025-04-18", // Good Friday
  "2025-05-19", // Victoria Day
  "2025-07-01", // Canada Day
  "2025-08-04", // Civic Holiday
  "2025-09-01", // Labour Day
  "2025-10-13", // Thanksgiving
  "2025-12-25", // Christmas Day
  "2025-12-26", // Boxing Day

  // 2026
  "2026-01-01", // New Year's Day
  "2026-02-16", // Family Day
  "2026-04-03", // Good Friday
  "2026-05-18", // Victoria Day
  "2026-07-01", // Canada Day
  "2026-08-03", // Civic Holiday
  "2026-09-07", // Labour Day
  "2026-10-12", // Thanksgiving
  "2026-12-25", // Christmas Day
  "2026-12-28", // Boxing Day (observed; Dec 26 is a Saturday)
]);
