import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import {
  formatDayNumber,
  formatHour,
  formatInteger,
  formatPlainDate,
  formatPlainDateRange,
  formatPlainTime,
  formatYearMonth,
  getDateTimeFormat,
  localeFirstDayOfWeek,
  localeTextDirection,
  localeWeekendDays,
  monthNames,
  resolveLocale,
  weekdayNames,
} from "./locale";

const date = Temporal.PlainDate.from;

describe("getDateTimeFormat", () => {
  it("caches formatters per locale and options", () => {
    const a = getDateTimeFormat("en-US", { month: "long" });
    const b = getDateTimeFormat("en-US", { month: "long" });
    const c = getDateTimeFormat("ja-JP", { month: "long" });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("formatPlainDate", () => {
  it("formats dates per locale", () => {
    const day = date("2026-07-18");
    expect(
      formatPlainDate("en-US", day, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ).toBe("July 18, 2026");
    expect(
      formatPlainDate("ja-JP", day, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }),
    ).toBe("2026/7/18");
  });

  it("survives two-digit years without Date's 19xx remapping", () => {
    const ancient = Temporal.PlainDate.from("0099-07-18");
    expect(formatPlainDate("en-US", ancient, { year: "numeric" })).toBe("99");
  });
});

describe("formatPlainDateRange", () => {
  it("formats an inclusive range", () => {
    const text = formatPlainDateRange(
      "en-US",
      date("2026-07-10"),
      date("2026-07-20"),
    );
    expect(text).toContain("10");
    expect(text).toContain("20");
    expect(text).toContain("2026");
  });
});

describe("formatYearMonth / formatDayNumber", () => {
  it("formats month titles", () => {
    const month = Temporal.PlainYearMonth.from("2026-07");
    expect(formatYearMonth("en-US", month)).toBe("July 2026");
    expect(formatYearMonth("ja-JP", month)).toBe("2026年7月");
  });

  it("localizes day numerals", () => {
    expect(formatDayNumber("en-US", date("2026-07-18"))).toBe("18");
    expect(formatDayNumber("ar-EG", date("2026-07-18"))).toMatch(/[٠-٩]/u);
  });
});

describe("formatPlainTime / formatHour", () => {
  it("respects the locale hour cycle", () => {
    const time = Temporal.PlainTime.from("13:05");
    expect(formatPlainTime("en-US", time)).toMatch(/1:05\s?PM/u);
    expect(formatPlainTime("ja-JP", time)).toBe("13:05");
    expect(formatHour("en-US", 13)).toMatch(/1\s?PM/u);
    expect(formatHour("ja-JP", 13)).toBe("13時");
  });
});

describe("weekdayNames", () => {
  it("orders labels from the configured first day of week", () => {
    expect(weekdayNames("en-US", "long", 1)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(weekdayNames("en-US", "long", 7)[0]).toBe("Sunday");
    expect(weekdayNames("ja-JP", "narrow", 7)).toEqual([
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土",
    ]);
  });
});

describe("monthNames", () => {
  it("lists the twelve ISO months", () => {
    const english = monthNames("en-US", "long");
    expect(english).toHaveLength(12);
    expect(english[0]).toBe("January");
    expect(english[11]).toBe("December");
    expect(monthNames("ja-JP", "long")[6]).toBe("7月");
  });
});

describe("locale week info", () => {
  it("derives the first day of week", () => {
    expect(localeFirstDayOfWeek("de-DE")).toBe(1);
    expect(localeFirstDayOfWeek("en-US")).toBe(7);
  });

  it("derives weekend days with a Saturday/Sunday fallback", () => {
    expect(localeWeekendDays("en-US")).toEqual([6, 7]);
    const fallback = localeWeekendDays("en-US-u-invalid");
    expect(fallback.every((day) => day >= 1 && day <= 7)).toBe(true);
  });
});

describe("localeTextDirection", () => {
  it("detects right-to-left locales", () => {
    expect(localeTextDirection("en-US")).toBe("ltr");
    expect(localeTextDirection("ja-JP")).toBe("ltr");
    expect(localeTextDirection("ar-EG")).toBe("rtl");
    expect(localeTextDirection("he-IL")).toBe("rtl");
  });
});

describe("formatInteger", () => {
  it("localizes digits without grouping", () => {
    expect(formatInteger("en-US", 29)).toBe("29");
    expect(formatInteger("ar-EG", 29)).toMatch(/[٠-٩]/u);
    expect(formatInteger("en-US", 1000)).toBe("1000");
  });
});

describe("resolveLocale", () => {
  it("normalizes inputs and defaults to the runtime locale", () => {
    expect(resolveLocale("ja-JP")).toBe("ja-JP");
    expect(resolveLocale(new Intl.Locale("fr-CA"))).toBe("fr-CA");
    expect(resolveLocale()).toBeTypeOf("string");
  });
});
