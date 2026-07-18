import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";
import { Temporal } from "../temporal";
import { useWeekGrid } from "./useWeekGrid";

const date = Temporal.PlainDate.from;

const makeSource = () => ({
  locale: shallowRef("en-US"),
  focusedDate: shallowRef(date("2026-07-18")),
  today: shallowRef(date("2026-07-18")),
  firstDayOfWeek: shallowRef<1 | 7>(1),
  weekendDays: shallowRef<readonly (6 | 7)[]>([6, 7]),
});

describe("useWeekGrid", () => {
  it("builds the focused week and localized hour labels", () => {
    const source = makeSource();
    const { grid, hourLabels } = useWeekGrid(source, {
      startHour: 12,
      endHour: 15,
    });
    expect(grid.value.range.start.toString()).toBe("2026-07-13");
    expect(hourLabels.value.map((entry) => entry.hour)).toEqual([12, 13, 14]);
    expect(hourLabels.value[1]?.label).toMatch(/1\s?PM/u);

    source.locale.value = "ja-JP";
    expect(hourLabels.value[1]?.label).toBe("13時");
  });

  it("reacts to a changing day count", () => {
    const source = makeSource();
    const days = shallowRef(7);
    const { grid } = useWeekGrid(source, { days });
    expect(grid.value.days).toHaveLength(7);
    days.value = 3;
    expect(grid.value.days.map((day) => day.key)).toEqual([
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
    ]);
  });
});
