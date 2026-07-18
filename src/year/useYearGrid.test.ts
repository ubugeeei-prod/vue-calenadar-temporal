import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";
import { Temporal } from "../temporal";
import { useYearGrid } from "./useYearGrid";

const date = Temporal.PlainDate.from;

describe("useYearGrid", () => {
  it("labels months per locale and tracks the focused year", () => {
    const locale = shallowRef("en-US");
    const focusedDate = shallowRef(date("2026-07-18"));
    const { grid, months } = useYearGrid({
      locale,
      focusedDate,
      today: shallowRef(date("2026-07-18")),
      firstDayOfWeek: shallowRef(1),
      weekendDays: shallowRef([6, 7]),
    });

    expect(grid.value.year).toBe(2026);
    expect(months.value[6]?.label).toBe("July");
    expect(months.value[6]?.isCurrent).toBe(true);

    locale.value = "ja-JP";
    expect(months.value[6]?.label).toBe("7月");

    focusedDate.value = date("2027-01-01");
    expect(grid.value.year).toBe(2027);
    expect(months.value.every((month) => !month.isCurrent)).toBe(true);
  });
});
