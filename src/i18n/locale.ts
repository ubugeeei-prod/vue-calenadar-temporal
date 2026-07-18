/**
 * Locale-aware formatting and locale introspection, built on `Intl`.
 *
 * Two design rules shape this module:
 *
 * 1. **Formatters are cached, values are cheap.** Constructing an
 *    `Intl.DateTimeFormat` is orders of magnitude slower than calling
 *    `format`, so every helper funnels through one per-process cache keyed
 *    by locale + options. Rendering a month of day numbers reuses a single
 *    formatter.
 * 2. **Temporal values are bridged through UTC epochs.** Each value is
 *    converted to the epoch millisecond of its wall-clock reading at UTC and
 *    formatted with `timeZone: "UTC"` forced. This works identically with
 *    the ponyfill and native `Temporal`, and never touches the machine's
 *    time zone. Consequence: any `timeZone` you pass inside `options` is
 *    deliberately ignored.
 *
 * Nothing here mutates or observes global state beyond the caches, so every
 * function is safe on the server and during hydration.
 *
 * @example
 * ```ts
 * formatPlainDate("ja-JP", date, { dateStyle: "long" }); // "2026年7月18日"
 * weekdayNames("fr-FR", "long", 1)[0];                   // "lundi"
 * localeFirstDayOfWeek("en-US");                         // 7 (Sunday)
 * localeTextDirection("ar-EG");                          // "rtl"
 * ```
 */
import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

/**
 * Label length for weekday and month names.
 *
 * Mirrors the `Intl.DateTimeFormat` vocabulary: `"long"` → `Monday`,
 * `"short"` → `Mon`, `"narrow"` → `M` (single glyph in most locales).
 */
export type NameStyle = "long" | "short" | "narrow";

/** Horizontal writing direction of a locale's script. */
export type TextDirection = "ltr" | "rtl";

export type resolveLocale = (locale?: string | Intl.Locale) => string;

export type getDateTimeFormat = (
  locale: string,
  options: Intl.DateTimeFormatOptions,
) => Intl.DateTimeFormat;

export type formatPlainDate = (
  locale: string,
  date: Temporal.PlainDate,
  options?: Intl.DateTimeFormatOptions,
) => string;

export type formatPlainDateRange = (
  locale: string,
  start: Temporal.PlainDate,
  end: Temporal.PlainDate,
  options?: Intl.DateTimeFormatOptions,
) => string;

export type formatYearMonth = (
  locale: string,
  month: Temporal.PlainYearMonth,
  options?: Intl.DateTimeFormatOptions,
) => string;

export type formatDayNumber = (
  locale: string,
  date: Temporal.PlainDate,
) => string;

export type formatPlainTime = (
  locale: string,
  time: Temporal.PlainTime,
  options?: Intl.DateTimeFormatOptions,
) => string;

export type formatHour = (locale: string, hour: number) => string;

export type weekdayNames = (
  locale: string,
  style: NameStyle,
  firstDayOfWeek: DayOfWeek,
) => readonly string[];

export type monthNames = (
  locale: string,
  style: NameStyle,
) => readonly string[];

export type localeFirstDayOfWeek = (locale: string) => DayOfWeek;

export type localeWeekendDays = (locale: string) => readonly DayOfWeek[];

export type localeTextDirection = (locale: string) => TextDirection;

export type formatInteger = (locale: string, value: number) => string;

export type formatPlainDateList = (
  locale: string,
  dates: readonly Temporal.PlainDate[],
  options?: Intl.DateTimeFormatOptions,
) => string;

// --- Implementation ---

/**
 * Normalizes a locale input to a BCP-47 tag.
 *
 * Accepts a tag (`"ja-JP"`), an `Intl.Locale` instance, or nothing — in
 * which case the runtime's default locale is used. On the server that
 * default is the *server's* locale; pass an explicit tag when server and
 * client output must match.
 *
 * @default the runtime's resolved locale
 *
 * @example
 * ```ts
 * resolveLocale("ja-JP");                 // "ja-JP"
 * resolveLocale(new Intl.Locale("fr-CA")); // "fr-CA"
 * resolveLocale();                        // e.g. "en-US"
 * ```
 */
export const resolveLocale: resolveLocale = (locale) => {
  if (locale === undefined) {
    return new Intl.DateTimeFormat().resolvedOptions().locale;
  }

  return typeof locale === "string" ? locale : locale.toString();
};

/**
 * Shared `Intl.DateTimeFormat` cache.
 *
 * Constructing formatters is the slow path (locale data loading), so every
 * formatting helper funnels through this per-process cache. Bounded in
 * practice by the number of distinct locale + options pairs an app uses.
 */
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

/** Stable cache key: locale + sorted, stringified option entries. */
const cacheKey = (
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => {
  const parts = Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}:${String(value)}`);

  return `${locale}${parts.join("")}`;
};

/**
 * A cached `Intl.DateTimeFormat` for `locale` + `options`.
 *
 * Identical inputs return the **same instance**, so the result is also a
 * usable memoization key. Reach for this directly when you need
 * `formatToParts` or another API the convenience helpers don't wrap.
 */
export const getDateTimeFormat: getDateTimeFormat = (locale, options) => {
  const key = cacheKey(locale, options);
  const cached = dateTimeFormatCache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const format = new Intl.DateTimeFormat(locale, options);
  dateTimeFormatCache.set(key, format);

  return format;
};

/**
 * Epoch milliseconds of the given wall-clock reading at UTC.
 *
 * Routed through `setUTCFullYear` so years 0–99 survive `Date.UTC`'s
 * historical 1900-remapping.
 */
const utcEpoch = (
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
): number => {
  const base = new Date(Date.UTC(2000, monthIndex, day, hour, minute));
  base.setUTCFullYear(year);

  return base.getTime();
};

/** The UTC-midnight epoch of a date, normalized to the ISO calendar. */
const plainDateEpoch = (date: Temporal.PlainDate): number => {
  const iso = date.withCalendar("iso8601");

  return utcEpoch(iso.year, iso.month - 1, iso.day);
};

/** Forces the UTC bridge; any caller-supplied `timeZone` is overridden. */
const inUtc = (
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions => ({
  ...options,
  timeZone: "UTC",
});

/**
 * Formats a calendar date.
 *
 * @param options - Any `Intl.DateTimeFormatOptions`; `timeZone` is ignored
 * (see the module docs).
 * @default `{ dateStyle: "long" }`
 *
 * @example
 * ```ts
 * const date = Temporal.PlainDate.from("2026-07-18");
 *
 * formatPlainDate("en-US", date);                        // "July 18, 2026"
 * formatPlainDate("ja-JP", date, { dateStyle: "full" }); // "2026年7月18日土曜日"
 * ```
 */
export const formatPlainDate: formatPlainDate = (
  locale,
  date,
  options = { dateStyle: "long" },
) => getDateTimeFormat(locale, inUtc(options)).format(plainDateEpoch(date));

/**
 * Formats an inclusive date range with `Intl`'s range machinery, which
 * collapses shared parts per locale — e.g. `"Jul 10 – 20, 2026"`.
 *
 * @default `{ dateStyle: "medium" }`
 */
export const formatPlainDateRange: formatPlainDateRange = (
  locale,
  start,
  end,
  options = { dateStyle: "medium" },
) =>
  getDateTimeFormat(locale, inUtc(options)).formatRange(
    plainDateEpoch(start),
    plainDateEpoch(end),
  );

/**
 * Formats a year-month, the natural month-view title.
 *
 * @default `{ year: "numeric", month: "long" }`
 *
 * @example
 * ```ts
 * const month = Temporal.PlainYearMonth.from("2026-07");
 *
 * formatYearMonth("en-US", month); // "July 2026"
 * formatYearMonth("ja-JP", month); // "2026年7月"
 * ```
 */
export const formatYearMonth: formatYearMonth = (
  locale,
  month,
  options = { year: "numeric", month: "long" },
) => {
  const iso = month.toPlainDate({ day: 1 }).withCalendar("iso8601");

  return getDateTimeFormat(locale, inUtc(options)).format(
    utcEpoch(iso.year, iso.month - 1, 1),
  );
};

/**
 * The day-of-month numeral in the locale's numbering system — `"18"` in
 * `en-US`, `"١٨"` in `ar-EG`. This is what day cells render.
 */
export const formatDayNumber: formatDayNumber = (locale, date) =>
  getDateTimeFormat(locale, inUtc({ day: "numeric" })).format(
    plainDateEpoch(date),
  );

/**
 * Formats a wall-clock time, honoring the locale's hour cycle —
 * `"1:05 PM"` in `en-US`, `"13:05"` in `ja-JP`.
 *
 * @default `{ hour: "numeric", minute: "2-digit" }`
 */
export const formatPlainTime: formatPlainTime = (
  locale,
  time,
  options = { hour: "numeric", minute: "2-digit" },
) =>
  getDateTimeFormat(locale, inUtc(options)).format(
    utcEpoch(2000, 0, 1, time.hour, time.minute),
  );

/**
 * A bare hour label for the time grid's axis — `"1 PM"` / `"13時"` —
 * honoring the locale's hour cycle.
 *
 * @param hour - Whole hour, `0`–`23`.
 */
export const formatHour: formatHour = (locale, hour) =>
  getDateTimeFormat(locale, inUtc({ hour: "numeric" })).format(
    utcEpoch(2000, 0, 1, hour),
  );

/** Monday 2024-01-01 anchors weekday-name generation. */
const WEEKDAY_ANCHOR_EPOCH = Date.UTC(2024, 0, 1);

const DAY_MS = 86_400_000;

/**
 * The seven weekday names, ordered so index `0` is `firstDayOfWeek` — ready
 * to zip against grid columns.
 *
 * @example
 * ```ts
 * weekdayNames("en-US", "long", 1)[0];   // "Monday"
 * weekdayNames("en-US", "long", 7)[0];   // "Sunday"
 * weekdayNames("ja-JP", "narrow", 7);    // ["日", "月", …, "土"]
 * ```
 */
export const weekdayNames: weekdayNames = (locale, style, firstDayOfWeek) => {
  const format = getDateTimeFormat(locale, inUtc({ weekday: style }));

  return Array.from({ length: 7 }, (_, offset) => {
    const dayOfWeek = ((firstDayOfWeek - 1 + offset) % 7) + 1;

    return format.format(WEEKDAY_ANCHOR_EPOCH + (dayOfWeek - 1) * DAY_MS);
  });
};

/**
 * The twelve ISO month names, January first.
 *
 * @example
 * ```ts
 * monthNames("en-US", "long")[6]; // "July"
 * monthNames("ja-JP", "long")[6]; // "7月"
 * ```
 */
export const monthNames: monthNames = (locale, style) => {
  const format = getDateTimeFormat(locale, inUtc({ month: style }));

  return Array.from({ length: 12 }, (_, monthIndex) =>
    format.format(Date.UTC(2024, monthIndex, 1)),
  );
};

type WeekInfo = {
  readonly firstDay: number;
  readonly weekend: readonly number[];
};

/**
 * CLDR week metadata via `Intl.Locale`, tolerating both the standardized
 * `getWeekInfo()` method and the older `weekInfo` accessor shape.
 */
const weekInfoOf = (locale: string): WeekInfo | undefined => {
  const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
    getWeekInfo?: () => WeekInfo;
    weekInfo?: WeekInfo;
  };

  return intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;
};

const isDayOfWeek = (value: number): value is DayOfWeek =>
  Number.isInteger(value) && value >= 1 && value <= 7;

/**
 * The locale's first day of week from CLDR data — `7` (Sunday) for
 * `en-US`, `1` (Monday) for `de-DE`.
 *
 * Falls back to Monday when the runtime exposes no week info.
 *
 * @default 1 (Monday) when week info is unavailable
 */
export const localeFirstDayOfWeek: localeFirstDayOfWeek = (locale) => {
  const firstDay = weekInfoOf(locale)?.firstDay;

  return firstDay !== undefined && isDayOfWeek(firstDay) ? firstDay : 1;
};

/**
 * The locale's weekend days from CLDR data — `[6, 7]` for most Western
 * locales, `[5, 6]` (Friday–Saturday) for several Middle-East locales.
 *
 * @default [6, 7] (Saturday/Sunday) when week info is unavailable
 */
export const localeWeekendDays: localeWeekendDays = (locale) => {
  const weekend = weekInfoOf(locale)?.weekend?.filter(isDayOfWeek);

  return weekend !== undefined && weekend.length > 0 ? weekend : [6, 7];
};

const listFormatCache = new Map<string, Intl.ListFormat>();

/**
 * A locale-aware "a, b, and c" list of formatted dates — the display value
 * for multiple-date selections.
 *
 * Conjunction style and separators come from `Intl.ListFormat`, so the
 * result reads naturally in every locale (`"…と…"`, `"… et …"`, …).
 *
 * @default `{ dateStyle: "medium" }` for the per-date format
 *
 * @example
 * ```ts
 * formatPlainDateList("en-US", [jul10, jul12]);
 * // "Jul 10, 2026 and Jul 12, 2026"
 * ```
 */
export const formatPlainDateList: formatPlainDateList = (
  locale,
  dates,
  options = { dateStyle: "medium" },
) => {
  const cached = listFormatCache.get(locale);
  const list =
    cached ??
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

  if (cached === undefined) {
    listFormatCache.set(locale, list);
  }

  return list.format(
    dates.map((date) => formatPlainDate(locale, date, options)),
  );
};

const numberFormatCache = new Map<string, Intl.NumberFormat>();

/**
 * An integer in the locale's numbering system, without grouping — used for
 * week numbers and counters (`29` → `"٢٩"` in `ar-EG`).
 */
export const formatInteger: formatInteger = (locale, value) => {
  const cached = numberFormatCache.get(locale);
  const format =
    cached ?? new Intl.NumberFormat(locale, { useGrouping: false });

  if (cached === undefined) {
    numberFormatCache.set(locale, format);
  }

  return format.format(value);
};

/**
 * Right-to-left languages, used when the runtime lacks `Intl` text-info
 * APIs. `iw` is the legacy tag for Hebrew.
 */
const RTL_LANGUAGES = new Set([
  "ar",
  "arc",
  "ckb",
  "dv",
  "fa",
  "he",
  "iw",
  "ks",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);

/**
 * The locale's script direction.
 *
 * Prefers the engine's text-info APIs (`getTextInfo()` / `textInfo`) and
 * falls back to a known RTL language list. Drives the root `dir` attribute
 * and the keyboard layer's arrow-key inversion.
 *
 * @example
 * ```ts
 * localeTextDirection("ja-JP"); // "ltr"
 * localeTextDirection("he-IL"); // "rtl"
 * ```
 */
export const localeTextDirection: localeTextDirection = (locale) => {
  const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
    getTextInfo?: () => { direction: TextDirection };
    textInfo?: { direction: TextDirection };
  };

  const direction = (intlLocale.getTextInfo?.() ?? intlLocale.textInfo)
    ?.direction;

  if (direction !== undefined) {
    return direction;
  }

  return RTL_LANGUAGES.has(intlLocale.language) ? "rtl" : "ltr";
};
