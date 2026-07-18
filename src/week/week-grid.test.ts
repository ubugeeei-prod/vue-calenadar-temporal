import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { buildWeekGrid } from "./week-grid";

const date = Temporal.PlainDate.from;

const baseOptions = {
  anchor: date("2026-07-18"), // Saturday
  today: date("2026-07-18"),
  firstDayOfWeek: 1,
  weekendDays: [6, 7],
} as const;

describe("buildWeekGrid", () => {
  it("snaps a full week to the first day of week", () => {
    const grid = buildWeekGrid(baseOptions);
    expect(grid.days).toHaveLength(7);
    expect(grid.range.start.toString()).toBe("2026-07-13");
    expect(grid.range.end.toString()).toBe("2026-07-19");
    expect(grid.days[0]?.dayOfWeek).toBe(1);
  });

  it("builds rolling views for other day counts", () => {
    const dayView = buildWeekGrid({ ...baseOptions, days: 1 });
    expect(dayView.days.map((day) => day.key)).toEqual(["2026-07-18"]);

    const threeDays = buildWeekGrid({ ...baseOptions, days: 3 });
    expect(threeDays.days.map((day) => day.key)).toEqual([
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
    ]);
  });

  it("marks today and weekends", () => {
    const grid = buildWeekGrid(baseOptions);
    const saturday = grid.days.find((day) => day.key === "2026-07-18");
    expect(saturday?.isToday).toBe(true);
    expect(saturday?.isWeekend).toBe(true);
    expect(grid.days.filter((day) => day.isWeekend)).toHaveLength(2);
  });

  it("exposes the full hour axis by default", () => {
    const grid = buildWeekGrid(baseOptions);
    expect(grid.hours).toHaveLength(24);
    expect(grid.hours[0]).toBe(0);
    expect(grid.hours[23]).toBe(23);
  });

  it("clamps a sliced hour axis", () => {
    const grid = buildWeekGrid({ ...baseOptions, startHour: 8, endHour: 20 });
    expect(grid.hours[0]).toBe(8);
    expect(grid.hours).toHaveLength(12);
    expect(grid.startHour).toBe(8);
    expect(grid.endHour).toBe(20);

    const degenerate = buildWeekGrid({
      ...baseOptions,
      startHour: 30,
      endHour: -2,
    });
    expect(degenerate.startHour).toBe(23);
    expect(degenerate.endHour).toBe(24);
    expect(degenerate.hours).toEqual([23]);
  });
});
