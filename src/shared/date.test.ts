import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import {
  clampDate,
  dayKey,
  daysFrom,
  daysInRange,
  endOfWeek,
  isBetween,
  isSameDay,
  isSameMonth,
  isWeekend,
  monthKey,
  orderedRange,
  startOfWeek,
} from "./date";

const date = Temporal.PlainDate.from;

describe("dayKey / monthKey", () => {
  it("produces ISO keys", () => {
    expect(dayKey(date("2026-07-18"))).toBe("2026-07-18");
    expect(monthKey(Temporal.PlainYearMonth.from("2026-07"))).toBe("2026-07");
  });
});

describe("isSameDay / isSameMonth", () => {
  it("compares by value", () => {
    expect(isSameDay(date("2026-07-18"), date("2026-07-18"))).toBe(true);
    expect(isSameDay(date("2026-07-18"), date("2026-07-19"))).toBe(false);
    expect(isSameMonth(date("2026-07-01"), date("2026-07-31"))).toBe(true);
    expect(isSameMonth(date("2026-07-01"), date("2026-08-01"))).toBe(false);
    expect(isSameMonth(date("2025-07-01"), date("2026-07-01"))).toBe(false);
  });
});

describe("isBetween", () => {
  const range = { start: date("2026-07-10"), end: date("2026-07-20") };

  it("is inclusive on both ends", () => {
    expect(isBetween(date("2026-07-10"), range)).toBe(true);
    expect(isBetween(date("2026-07-20"), range)).toBe(true);
    expect(isBetween(date("2026-07-15"), range)).toBe(true);
    expect(isBetween(date("2026-07-09"), range)).toBe(false);
    expect(isBetween(date("2026-07-21"), range)).toBe(false);
  });
});

describe("clampDate", () => {
  it("clamps to bounds when provided", () => {
    const min = date("2026-07-10");
    const max = date("2026-07-20");
    expect(clampDate(date("2026-07-01"), min, max)).toEqual(min);
    expect(clampDate(date("2026-07-31"), min, max)).toEqual(max);
    expect(clampDate(date("2026-07-15"), min, max)).toEqual(date("2026-07-15"));
    expect(clampDate(date("2026-07-01"), undefined, undefined)).toEqual(
      date("2026-07-01"),
    );
  });
});

describe("startOfWeek / endOfWeek", () => {
  // 2026-07-18 is a Saturday (dayOfWeek 6).
  it("respects the first day of week", () => {
    expect(startOfWeek(date("2026-07-18"), 1).toString()).toBe("2026-07-13");
    expect(startOfWeek(date("2026-07-18"), 7).toString()).toBe("2026-07-12");
    expect(startOfWeek(date("2026-07-18"), 6).toString()).toBe("2026-07-18");
    expect(endOfWeek(date("2026-07-18"), 1).toString()).toBe("2026-07-19");
    expect(endOfWeek(date("2026-07-18"), 7).toString()).toBe("2026-07-18");
  });

  it("is idempotent for a date already at the start", () => {
    const monday = date("2026-07-13");
    expect(startOfWeek(monday, 1)).toEqual(monday);
  });
});

describe("daysFrom / daysInRange", () => {
  it("generates consecutive days across month boundaries", () => {
    const days = daysFrom(date("2026-07-30"), 4);
    expect(days.map((d) => d.toString())).toEqual([
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("returns an empty list for non-positive counts", () => {
    expect(daysFrom(date("2026-07-18"), 0)).toEqual([]);
    expect(daysFrom(date("2026-07-18"), -3)).toEqual([]);
  });

  it("expands an inclusive range", () => {
    const days = daysInRange({
      start: date("2026-07-18"),
      end: date("2026-07-20"),
    });
    expect(days).toHaveLength(3);
    expect(
      daysInRange({ start: date("2026-07-18"), end: date("2026-07-18") }),
    ).toHaveLength(1);
  });
});

describe("isWeekend", () => {
  it("checks membership against configurable weekend days", () => {
    expect(isWeekend(date("2026-07-18"), [6, 7])).toBe(true);
    expect(isWeekend(date("2026-07-17"), [6, 7])).toBe(false);
    // Friday/Saturday weekend (e.g. some Middle East locales).
    expect(isWeekend(date("2026-07-17"), [5, 6])).toBe(true);
  });
});

describe("orderedRange", () => {
  it("orders endpoints", () => {
    const range = orderedRange(date("2026-07-20"), date("2026-07-10"));
    expect(range.start.toString()).toBe("2026-07-10");
    expect(range.end.toString()).toBe("2026-07-20");
  });
});
