import { describe, expect, it } from "vitest";
import {
  InvalidDateError,
  addDays,
  daysUntil,
  diffDays,
  dayOfWeek,
  fromISODate,
  humanDate,
  isBusinessDay,
  isValidISODate,
  isWeekend,
  rollForwardToBusinessDay,
  toISODate,
} from "@/engine/dates";

describe("ISO date parsing", () => {
  it("round-trips a valid date in UTC", () => {
    expect(toISODate(fromISODate("2025-04-25"))).toBe("2025-04-25");
  });

  it("rejects malformed strings", () => {
    expect(() => fromISODate("2025-4-25")).toThrow(InvalidDateError);
    expect(() => fromISODate("April 25, 2025")).toThrow(InvalidDateError);
    expect(() => fromISODate("")).toThrow(InvalidDateError);
  });

  it("rejects impossible calendar dates instead of rolling over", () => {
    expect(() => fromISODate("2025-02-30")).toThrow(InvalidDateError);
    expect(() => fromISODate("2025-13-01")).toThrow(InvalidDateError);
    expect(isValidISODate("2024-02-29")).toBe(true); // real leap day
    expect(isValidISODate("2025-02-29")).toBe(false); // not a leap year
  });
});

describe("addDays", () => {
  it("adds calendar days across a month boundary", () => {
    expect(addDays("2025-04-25", 30)).toBe("2025-05-25");
  });
  it("adds across a year boundary", () => {
    expect(addDays("2025-12-20", 30)).toBe("2026-01-19");
  });
  it("subtracts with a negative", () => {
    expect(addDays("2025-03-01", -1)).toBe("2025-02-28");
  });
  it("handles a leap day correctly", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
  });
});

describe("weekday / weekend / business-day", () => {
  it("knows the day of week (2025-04-25 is a Friday)", () => {
    expect(dayOfWeek("2025-04-25")).toBe(5);
    expect(isWeekend("2025-04-25")).toBe(false);
    expect(isWeekend("2025-04-26")).toBe(true); // Saturday
    expect(isWeekend("2025-04-27")).toBe(true); // Sunday
  });

  it("rolls a Saturday deadline forward to Monday", () => {
    // 2025-05-24 is a Saturday → Monday 2025-05-26.
    expect(rollForwardToBusinessDay("2025-05-24")).toBe("2025-05-26");
  });

  it("rolls forward across a holiday that lands on the next business day", () => {
    // If Monday 2025-05-26 is a holiday, the deadline lands Tuesday 2025-05-27.
    const holidays = new Set(["2025-05-26"]);
    expect(rollForwardToBusinessDay("2025-05-24", holidays)).toBe("2025-05-27");
    expect(isBusinessDay("2025-05-26", holidays)).toBe(false);
  });

  it("leaves a normal weekday unchanged", () => {
    expect(rollForwardToBusinessDay("2025-04-25")).toBe("2025-04-25");
  });
});

describe("diffs and countdown", () => {
  it("computes whole-day differences", () => {
    expect(diffDays("2025-04-25", "2025-05-25")).toBe(30);
    expect(diffDays("2025-05-25", "2025-04-25")).toBe(-30);
  });

  it("daysUntil is positive in the future and negative in the past", () => {
    const now = new Date("2025-04-25T12:00:00Z");
    expect(daysUntil("2025-05-25", now)).toBe(30);
    expect(daysUntil("2025-04-20", now)).toBe(-5);
    expect(daysUntil("2025-04-25", now)).toBe(0);
  });
});

describe("humanDate", () => {
  it("formats deterministically regardless of locale", () => {
    expect(humanDate("2025-04-25")).toBe("April 25, 2025");
    expect(humanDate("2026-01-01")).toBe("January 1, 2026");
  });
});
