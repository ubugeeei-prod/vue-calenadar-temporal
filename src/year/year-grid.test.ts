import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { buildYearGrid } from "./year-grid";

const date = Temporal.PlainDate.from;

const baseOptions = {
  anchor: date("2026-07-18"),
  today: date("2026-07-18"),
  firstDayOfWeek: 1,
  weekendDays: [6, 7],
} as const;

describe("buildYearGrid", () => {
  it("builds twelve uniform mini months", () => {
    const grid = buildYearGrid(baseOptions);
    expect(grid.year).toBe(2026);
    expect(grid.months).toHaveLength(12);
    expect(grid.months[0]?.key).toBe("2026-01");
    expect(grid.months[11]?.key).toBe("2026-12");
    for (const month of grid.months) expect(month.grid.weeks).toHaveLength(6);
  });

  it("marks only the month containing today as current", () => {
    const grid = buildYearGrid(baseOptions);
    expect(
      grid.months.filter((month) => month.isCurrent).map((month) => month.key),
    ).toEqual(["2026-07"]);

    const otherYear = buildYearGrid({
      ...baseOptions,
      anchor: date("2027-03-01"),
    });
    expect(otherYear.months.some((month) => month.isCurrent)).toBe(false);
  });

  it("covers the calendar year range", () => {
    const grid = buildYearGrid(baseOptions);
    expect(grid.range.start.toString()).toBe("2026-01-01");
    expect(grid.range.end.toString()).toBe("2026-12-31");
  });
});
