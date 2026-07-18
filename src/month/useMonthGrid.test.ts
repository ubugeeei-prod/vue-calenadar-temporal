import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";
import { Temporal } from "../temporal";
import { useMonthGrid } from "./useMonthGrid";

const date = Temporal.PlainDate.from;

const makeSource = () => ({
  locale: shallowRef("en-US"),
  focusedDate: shallowRef(date("2026-07-18")),
  today: shallowRef(date("2026-07-18")),
  firstDayOfWeek: shallowRef<1 | 7>(1),
  weekendDays: shallowRef<readonly (1 | 6 | 7)[]>([6, 7]),
});

describe("useMonthGrid", () => {
  it("tracks the focused month reactively", () => {
    const source = makeSource();
    const { grid } = useMonthGrid(source);
    expect(grid.value.month.toString()).toBe("2026-07");

    source.focusedDate.value = date("2026-09-01");
    expect(grid.value.month.toString()).toBe("2026-09");
  });

  it("exposes localized weekday headers aligned with the grid", () => {
    const source = makeSource();
    const { weekdays } = useMonthGrid(source, { weekdayStyle: "narrow" });
    expect(weekdays.value.map((day) => day.dayOfWeek)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(weekdays.value[0]?.fullName).toBe("Monday");

    source.locale.value = "ja-JP";
    source.firstDayOfWeek.value = 7;
    expect(weekdays.value.map((day) => day.label)).toEqual([
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土",
    ]);
    expect(weekdays.value[0]?.dayOfWeek).toBe(7);
  });

  it("applies reactive fixedWeekCount", () => {
    const source = makeSource();
    const fixed = shallowRef(false);
    const { grid } = useMonthGrid(source, { fixedWeekCount: fixed });
    expect(grid.value.weeks).toHaveLength(5);
    fixed.value = true;
    expect(grid.value.weeks).toHaveLength(6);
  });
});
