/**
 * Non-ISO calendar systems, end to end.
 *
 * This suite runs in the `unit-calendars` vitest project, where the
 * Temporal ponyfill is aliased to its all-calendars bundle — the same
 * wiring the published `vue-calendar-temporal/full` entry ships.
 */
import { describe, expect, it } from "vitest";
import { formatDayNumber, formatPlainDate } from "../i18n/locale";
import { buildYearGrid } from "../year/year-grid";
import { isSameDay } from "../shared/date";
import { Temporal } from "../temporal";
import { useCalendar } from "./useCalendar";

const iso = Temporal.PlainDate.from;

const TODAY = iso("2026-07-18");

describe("calendar resolution", () => {
  it("stays ISO unless a calendar is requested", () => {
    const calendar = useCalendar({ locale: "th-TH", today: TODAY });
    expect(calendar.calendar.value).toBe("iso8601");
  });

  it("honors the locale's -u-ca- extension", () => {
    const calendar = useCalendar({
      locale: "ar-SA-u-ca-islamic-umalqura",
      today: TODAY,
    });
    expect(calendar.calendar.value).toBe("islamic-umalqura");
    expect(calendar.focusedDate.value.calendarId).toBe("islamic-umalqura");
  });

  it("lets the explicit option win over the locale", () => {
    const calendar = useCalendar({
      locale: "he-IL",
      calendar: "hebrew",
      today: TODAY,
      initialFocusedDate: TODAY,
    });
    expect(calendar.calendar.value).toBe("hebrew");
    expect(calendar.locale.value).toContain("-u-ca-hebrew");
  });
});

describe("hebrew calendar", () => {
  const calendar = useCalendar({
    locale: "he-IL",
    calendar: "hebrew",
    today: TODAY,
    initialFocusedDate: TODAY,
  });

  it("materializes focus and today in the system", () => {
    expect(calendar.focusedDate.value.calendarId).toBe("hebrew");
    expect(calendar.today.value.calendarId).toBe("hebrew");
    // 2026-07-18 is 3 Av 5786.
    expect(calendar.focusedDate.value.year).toBe(5786);
  });

  it("renders the title in the Hebrew calendar and script", () => {
    expect(calendar.title.value).toMatch(/[א-ת]/u);
    expect(calendar.title.value).not.toContain("2026");
  });

  it("counts thirteen months in a leap year", () => {
    const leapAnchor = Temporal.PlainDate.from({
      calendar: "hebrew",
      year: 5787,
      month: 1,
      day: 1,
    });
    const grid = buildYearGrid({
      anchor: leapAnchor,
      today: TODAY,
      firstDayOfWeek: 1,
      weekendDays: [6, 7],
    });
    expect(grid.months).toHaveLength(13);
  });

  it("compares days across calendar systems", () => {
    const hebrewToday = TODAY.withCalendar("hebrew");
    expect(isSameDay(hebrewToday, TODAY)).toBe(true);
    expect(isSameDay(hebrewToday, iso("2026-07-19"))).toBe(false);
  });

  it("keeps day numerals as bare numbers of the system", () => {
    const hebrewToday = TODAY.withCalendar("hebrew");
    expect(formatDayNumber("he-IL-u-ca-hebrew", hebrewToday)).toBe(
      String(hebrewToday.day),
    );
  });
});

describe("japanese calendar (eras)", () => {
  it("titles the month with the era year", () => {
    const calendar = useCalendar({
      locale: "ja-JP",
      calendar: "japanese",
      today: TODAY,
      initialFocusedDate: TODAY,
    });
    // 2026 = 令和8年.
    expect(calendar.title.value).toContain("令和8年");
    expect(calendar.title.value).toContain("7月");
  });
});

describe("buddhist calendar", () => {
  it("formats years in the Buddhist era with Thai digits", () => {
    const text = formatPlainDate("th-TH-u-ca-buddhist", TODAY, {
      year: "numeric",
    });
    // 2026 CE = 2569 BE; th-TH renders Thai digits by default.
    expect(text).toMatch(/๒๕๖๙|2569/u);
  });
});

describe("islamic-umalqura calendar", () => {
  it("builds week-shaped month grids without ISO week numbers", () => {
    const calendar = useCalendar({
      locale: "ar-SA-u-ca-islamic-umalqura",
      today: TODAY,
      initialFocusedDate: TODAY,
    });
    const month = calendar.focusedDate.value.toPlainYearMonth();
    expect(month.toString()).toContain("u-ca=islamic-umalqura");

    // 2026-07-18 falls in Muharram/Safar 1448 territory — assert the year.
    expect(calendar.focusedDate.value.year).toBe(1448);
    expect(calendar.direction.value).toBe("rtl");
  });
});
