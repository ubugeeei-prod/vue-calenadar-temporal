import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { buildMonthGrid } from "./month-grid";

const month = Temporal.PlainYearMonth.from;
const date = Temporal.PlainDate.from;

const baseOptions = {
  month: month("2026-07"),
  today: date("2026-07-18"),
  firstDayOfWeek: 1,
  weekendDays: [6, 7],
} as const;

describe("buildMonthGrid", () => {
  it("snaps the grid to full weeks around the month", () => {
    const grid = buildMonthGrid(baseOptions);
    // July 2026 starts on Wednesday and ends on Friday.
    expect(grid.range.start.toString()).toBe("2026-06-29");
    expect(grid.range.end.toString()).toBe("2026-08-02");
    expect(grid.weeks).toHaveLength(5);
    for (const week of grid.weeks) expect(week.days).toHaveLength(7);
  });

  it("honors the first day of week", () => {
    const grid = buildMonthGrid({ ...baseOptions, firstDayOfWeek: 7 });
    expect(grid.range.start.toString()).toBe("2026-06-28");
    expect(grid.range.end.toString()).toBe("2026-08-01");
    expect(grid.weeks[0]?.days[0]?.dayOfWeek).toBe(7);
  });

  it("marks outside, today, and weekend days", () => {
    const grid = buildMonthGrid(baseOptions);
    const firstWeek = grid.weeks[0];
    expect(firstWeek?.days[0]?.isOutside).toBe(true); // 2026-06-29
    expect(firstWeek?.days[2]?.isOutside).toBe(false); // 2026-07-01

    const days = grid.weeks.flatMap((week) => week.days);
    const today = days.find((day) => day.key === "2026-07-18");
    expect(today?.isToday).toBe(true);
    expect(today?.isWeekend).toBe(true); // Saturday
    expect(days.filter((day) => day.isToday)).toHaveLength(1);
  });

  it("renders exactly four weeks for a perfectly aligned February", () => {
    // February 2027 starts on Monday and has 28 days.
    const grid = buildMonthGrid({ ...baseOptions, month: month("2027-02") });
    expect(grid.weeks).toHaveLength(4);
    expect(
      grid.weeks.flatMap((week) => week.days).every((day) => !day.isOutside),
    ).toBe(true);
  });

  it("pads to six weeks with fixedWeekCount", () => {
    const grid = buildMonthGrid({
      ...baseOptions,
      month: month("2027-02"),
      fixedWeekCount: true,
    });
    expect(grid.weeks).toHaveLength(6);
    expect(grid.range.start.toString()).toBe("2027-02-01");
    expect(grid.range.end.toString()).toBe("2027-03-14");
  });

  it("derives ISO week numbers from each row's Thursday", () => {
    const grid = buildMonthGrid({ ...baseOptions, firstDayOfWeek: 7 });
    // First row 2026-06-28 (Sun) … 2026-07-04 (Sat); its Thursday is 2026-07-02 → ISO week 27.
    expect(grid.weeks[0]?.weekNumber).toBe(27);
    // Rows advance one ISO week at a time.
    expect(grid.weeks[1]?.weekNumber).toBe(28);
  });

  it("keeps week numbers stable across years", () => {
    const grid = buildMonthGrid({ ...baseOptions, month: month("2026-01") });
    // 2026-01-01 is a Thursday, so the first row is ISO week 1.
    expect(grid.weeks[0]?.weekNumber).toBe(1);
  });
});
