import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";
import type { DateRange } from "../shared/date";
import { Temporal } from "../temporal";
import { useCalendar } from "./useCalendar";

const date = Temporal.PlainDate.from;

const TODAY = date("2026-07-18");

const baseOptions = {
  locale: "en-US",
  timeZone: "Asia/Tokyo",
  today: TODAY,
  initialFocusedDate: TODAY,
} as const;

describe("useCalendar — configuration", () => {
  it("derives week configuration from the locale", () => {
    const calendar = useCalendar({ ...baseOptions, locale: "ja-JP" });
    expect(calendar.firstDayOfWeek.value).toBe(7);
    expect(calendar.direction.value).toBe("ltr");
    expect(calendar.weekendDays.value).toEqual([6, 7]);
  });

  it("lets explicit options win over locale defaults", () => {
    const calendar = useCalendar({
      ...baseOptions,
      locale: "ar-EG",
      firstDayOfWeek: 1,
      direction: "ltr",
    });
    expect(calendar.firstDayOfWeek.value).toBe(1);
    expect(calendar.direction.value).toBe("ltr");
  });

  it("reacts to locale changes", () => {
    const locale = shallowRef("en-US");
    const calendar = useCalendar({ ...baseOptions, locale });
    expect(calendar.title.value).toBe("July 2026");
    locale.value = "ja-JP";
    expect(calendar.title.value).toBe("2026年7月");
  });
});

describe("useCalendar — view and navigation", () => {
  it("defaults to the month view with a formatted title", () => {
    const calendar = useCalendar(baseOptions);
    expect(calendar.view.value).toBe("month");
    expect(calendar.title.value).toBe("July 2026");
    expect(calendar.visibleRange.value).toEqual({
      start: date("2026-07-01"),
      end: date("2026-07-31"),
    });
  });

  it("navigates by the view granularity", () => {
    const calendar = useCalendar(baseOptions);
    calendar.next();
    expect(calendar.focusedDate.value.toString()).toBe("2026-08-18");
    calendar.setView("week");
    calendar.previous();
    expect(calendar.focusedDate.value.toString()).toBe("2026-08-11");
    calendar.goToToday();
    expect(calendar.focusedDate.value.toString()).toBe("2026-07-18");
  });

  it("stops navigation at min/max bounds", () => {
    const calendar = useCalendar({ ...baseOptions, minDate: date("2026-07-01") });
    expect(calendar.canGoPrevious.value).toBe(false);
    calendar.previous();
    expect(calendar.focusedDate.value.toString()).toBe("2026-07-18");
    expect(calendar.canGoNext.value).toBe(true);
  });

  it("supports a controlled view", () => {
    const view = shallowRef<"month" | "week" | "year">("year");
    const updates: string[] = [];
    const calendar = useCalendar({
      ...baseOptions,
      view,
      onUpdateView: (next) => updates.push(next),
    });
    expect(calendar.view.value).toBe("year");
    calendar.setView("week");
    // Controlled: the external source stays authoritative until the owner applies it.
    expect(calendar.view.value).toBe("year");
    expect(updates).toEqual(["week"]);
    view.value = "week";
    expect(calendar.view.value).toBe("week");
    expect(calendar.title.value).toContain("2026");
  });
});

describe("useCalendar — selection", () => {
  it("selects a single date and reports updates", () => {
    const seen: (Temporal.PlainDate | null)[] = [];
    const calendar = useCalendar({
      ...baseOptions,
      onUpdateSelected: (value) => seen.push(value),
    });
    calendar.select(date("2026-07-20"));
    expect(calendar.selected.value?.toString()).toBe("2026-07-20");
    expect(calendar.isSelected(date("2026-07-20"))).toBe(true);
    expect(seen.map((value) => value?.toString())).toEqual(["2026-07-20"]);
  });

  it("ignores disabled dates", () => {
    const calendar = useCalendar({
      ...baseOptions,
      maxDate: date("2026-07-20"),
      isDateDisabled: (candidate) => candidate.dayOfWeek === 7,
    });
    calendar.select(date("2026-07-25"));
    expect(calendar.selected.value).toBeNull();
    calendar.select(date("2026-07-19")); // Sunday
    expect(calendar.selected.value).toBeNull();
    expect(calendar.isDateDisabled(date("2026-07-19"))).toBe(true);
    calendar.select(date("2026-07-20"));
    expect(calendar.selected.value?.toString()).toBe("2026-07-20");
  });

  it("toggles dates in multiple mode", () => {
    const calendar = useCalendar({ ...baseOptions, selectionMode: "multiple" });
    calendar.select(date("2026-07-18"));
    calendar.select(date("2026-07-10"));
    expect(calendar.selected.value.map(String)).toEqual(["2026-07-10", "2026-07-18"]);
    calendar.select(date("2026-07-18"));
    expect(calendar.selected.value.map(String)).toEqual(["2026-07-10"]);
  });

  it("builds ranges in two picks with a hover preview", () => {
    const calendar = useCalendar({ ...baseOptions, selectionMode: "range" });
    calendar.select(date("2026-07-18"));
    expect(calendar.selected.value).toBeNull();
    expect(calendar.pendingRangeStart.value?.toString()).toBe("2026-07-18");

    calendar.hoverDate(date("2026-07-15"));
    expect(calendar.previewRange.value?.start.toString()).toBe("2026-07-15");
    expect(calendar.previewRange.value?.end.toString()).toBe("2026-07-18");

    calendar.select(date("2026-07-15"));
    expect(calendar.pendingRangeStart.value).toBeNull();
    expect(calendar.selected.value?.start.toString()).toBe("2026-07-15");
    expect(calendar.selected.value?.end.toString()).toBe("2026-07-18");
    expect(calendar.rangeEdgeOf(date("2026-07-15"))).toBe("start");
    expect(calendar.rangeEdgeOf(date("2026-07-18"))).toBe("end");
  });

  it("supports a controlled selection value", () => {
    const selected = shallowRef<DateRange | null>(null);
    const calendar = useCalendar({
      ...baseOptions,
      selectionMode: "range",
      selected,
      onUpdateSelected: (value) => {
        selected.value = value;
      },
    });
    calendar.select(date("2026-07-10"));
    calendar.select(date("2026-07-12"));
    expect(selected.value?.start.toString()).toBe("2026-07-10");
    expect(calendar.selected.value?.end.toString()).toBe("2026-07-12");
  });
});
