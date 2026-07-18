import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { canShiftPeriod, periodRange, shiftPeriod } from "./calendar";

const date = Temporal.PlainDate.from;

describe("shiftPeriod", () => {
  it("moves by the view's granularity", () => {
    const anchor = date("2026-07-18");
    expect(shiftPeriod("month", anchor, 1).toString()).toBe("2026-08-18");
    expect(shiftPeriod("week", anchor, -1).toString()).toBe("2026-07-11");
    expect(shiftPeriod("year", anchor, 1).toString()).toBe("2027-07-18");
  });

  it("clamps impossible days instead of overflowing", () => {
    expect(shiftPeriod("month", date("2026-01-31"), 1).toString()).toBe(
      "2026-02-28",
    );
  });
});

describe("periodRange", () => {
  const anchor = date("2026-07-18");

  it("computes natural period bounds", () => {
    expect(periodRange("month", anchor, 1)).toEqual({
      start: date("2026-07-01"),
      end: date("2026-07-31"),
    });
    expect(periodRange("week", anchor, 1)).toEqual({
      start: date("2026-07-13"),
      end: date("2026-07-19"),
    });
    expect(periodRange("year", anchor, 1)).toEqual({
      start: date("2026-01-01"),
      end: date("2026-12-31"),
    });
  });
});

describe("canShiftPeriod", () => {
  const anchor = date("2026-07-18");

  it("blocks navigation when the target period is fully out of bounds", () => {
    const min = date("2026-07-01");
    expect(canShiftPeriod("month", anchor, -1, 1, min, undefined)).toBe(false);
    expect(canShiftPeriod("month", anchor, 1, 1, min, undefined)).toBe(true);

    const max = date("2026-07-31");
    expect(canShiftPeriod("month", anchor, 1, 1, undefined, max)).toBe(false);
    expect(canShiftPeriod("week", anchor, 1, 1, undefined, max)).toBe(true);
    expect(
      canShiftPeriod("week", date("2026-07-29"), 1, 1, undefined, max),
    ).toBe(false);
  });

  it("allows navigation into partially visible periods", () => {
    // Week 2026-06-29 … 2026-07-05 overlaps min by a few days.
    expect(
      canShiftPeriod(
        "week",
        date("2026-07-08"),
        -1,
        1,
        date("2026-07-03"),
        undefined,
      ),
    ).toBe(true);
  });
});
