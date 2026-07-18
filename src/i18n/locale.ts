import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

/** Label length for weekday and month names. */
export type NameStyle = "long" | "short" | "narrow";

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

export const resolveLocale: resolveLocale = (locale) => {
  if (locale === undefined)
    return new Intl.DateTimeFormat().resolvedOptions().locale;
  return typeof locale === "string" ? locale : locale.toString();
};

/**
 * Shared `Intl.DateTimeFormat` cache.
 *
 * Constructing formatters is orders of magnitude slower than formatting, so
 * every formatting helper funnels through this per-process cache.
 */
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

const cacheKey = (
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => {
  const parts = Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}:${String(value)}`);
  return `${locale}${parts.join("")}`;
};

export const getDateTimeFormat: getDateTimeFormat = (locale, options) => {
  const key = cacheKey(locale, options);
  const cached = dateTimeFormatCache.get(key);
  if (cached !== undefined) return cached;
  const format = new Intl.DateTimeFormat(locale, options);
  dateTimeFormatCache.set(key, format);
  return format;
};

/**
 * Epoch milliseconds of the ISO date at UTC midnight.
 *
 * Formatting Temporal values through `Date` + `timeZone: "UTC"` works with
 * both the ponyfill and native `Temporal`, and lets us reuse cached native
 * formatters instead of `toLocaleString` (which constructs one per call).
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

const plainDateEpoch = (date: Temporal.PlainDate): number => {
  const iso = date.withCalendar("iso8601");
  return utcEpoch(iso.year, iso.month - 1, iso.day);
};

const inUtc = (
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions => ({
  ...options,
  timeZone: "UTC",
});

export const formatPlainDate: formatPlainDate = (
  locale,
  date,
  options = { dateStyle: "long" },
) => getDateTimeFormat(locale, inUtc(options)).format(plainDateEpoch(date));

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

export const formatDayNumber: formatDayNumber = (locale, date) =>
  getDateTimeFormat(locale, inUtc({ day: "numeric" })).format(
    plainDateEpoch(date),
  );

export const formatPlainTime: formatPlainTime = (
  locale,
  time,
  options = { hour: "numeric", minute: "2-digit" },
) =>
  getDateTimeFormat(locale, inUtc(options)).format(
    utcEpoch(2000, 0, 1, time.hour, time.minute),
  );

export const formatHour: formatHour = (locale, hour) =>
  getDateTimeFormat(locale, inUtc({ hour: "numeric" })).format(
    utcEpoch(2000, 0, 1, hour),
  );

/** Monday 2024-01-01 anchors weekday name generation. */
const WEEKDAY_ANCHOR_EPOCH = Date.UTC(2024, 0, 1);
const DAY_MS = 86_400_000;

export const weekdayNames: weekdayNames = (locale, style, firstDayOfWeek) => {
  const format = getDateTimeFormat(locale, inUtc({ weekday: style }));
  return Array.from({ length: 7 }, (_, offset) => {
    const dayOfWeek = ((firstDayOfWeek - 1 + offset) % 7) + 1;
    return format.format(WEEKDAY_ANCHOR_EPOCH + (dayOfWeek - 1) * DAY_MS);
  });
};

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

const weekInfoOf = (locale: string): WeekInfo | undefined => {
  const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
    getWeekInfo?: () => WeekInfo;
    weekInfo?: WeekInfo;
  };
  return intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;
};

const isDayOfWeek = (value: number): value is DayOfWeek =>
  Number.isInteger(value) && value >= 1 && value <= 7;

export const localeFirstDayOfWeek: localeFirstDayOfWeek = (locale) => {
  const firstDay = weekInfoOf(locale)?.firstDay;
  return firstDay !== undefined && isDayOfWeek(firstDay) ? firstDay : 1;
};

export const localeWeekendDays: localeWeekendDays = (locale) => {
  const weekend = weekInfoOf(locale)?.weekend?.filter(isDayOfWeek);
  return weekend !== undefined && weekend.length > 0 ? weekend : [6, 7];
};

const listFormatCache = new Map<string, Intl.ListFormat>();

/** Locale-aware "a, b, and c" list of dates (multiple-selection display). */
export const formatPlainDateList: formatPlainDateList = (
  locale,
  dates,
  options = { dateStyle: "medium" },
) => {
  const cached = listFormatCache.get(locale);
  const list =
    cached ??
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  if (cached === undefined) listFormatCache.set(locale, list);
  return list.format(
    dates.map((date) => formatPlainDate(locale, date, options)),
  );
};

const numberFormatCache = new Map<string, Intl.NumberFormat>();

/** Locale-aware integer rendering (week numbers, counters). */
export const formatInteger: formatInteger = (locale, value) => {
  const cached = numberFormatCache.get(locale);
  const format =
    cached ?? new Intl.NumberFormat(locale, { useGrouping: false });
  if (cached === undefined) numberFormatCache.set(locale, format);
  return format.format(value);
};

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

export const localeTextDirection: localeTextDirection = (locale) => {
  const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
    getTextInfo?: () => { direction: TextDirection };
    textInfo?: { direction: TextDirection };
  };
  const direction = (intlLocale.getTextInfo?.() ?? intlLocale.textInfo)
    ?.direction;
  if (direction !== undefined) return direction;
  return RTL_LANGUAGES.has(intlLocale.language) ? "rtl" : "ltr";
};
