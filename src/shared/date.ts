/**
 * Pure, framework-free date arithmetic on top of Temporal.
 *
 * Everything in this module is a small total function over immutable
 * `Temporal` values: no clocks (except {@link currentDate} and
 * {@link systemTimeZone}, which are the explicit clock boundary), no
 * reactivity, no locale access. Week math is parameterized by
 * {@link DayOfWeek} so a single implementation serves Monday-start,
 * Sunday-start, and every other convention.
 *
 * @example
 * ```ts
 * import { Temporal, startOfWeek, daysInRange } from "vue-calendar-temporal";
 *
 * const date = Temporal.PlainDate.from("2026-07-18"); // a Saturday
 *
 * startOfWeek(date, 1).toString(); // "2026-07-13" (Monday start)
 * startOfWeek(date, 7).toString(); // "2026-07-12" (Sunday start)
 *
 * daysInRange({ start: date, end: date.add({ days: 2 }) }).length; // 3
 * ```
 */
import { Temporal } from "../temporal";

// --- Types & Signatures ---

declare const DayKeyMarker: unique symbol;

/**
 * Nominal key for a calendar day, shaped `YYYY-MM-DD`.
 *
 * Produced only by {@link dayKey}; the brand keeps arbitrary strings out of
 * day-indexed maps at the type level, so `index.get("oops")` fails to
 * compile instead of silently missing at runtime.
 */
export type DayKey = string & { readonly [DayKeyMarker]: never };

declare const MonthKeyMarker: unique symbol;

/**
 * Nominal key for a calendar month, shaped `YYYY-MM`.
 *
 * Produced only by {@link monthKey}. See {@link DayKey} for why the brand
 * exists.
 */
export type MonthKey = string & { readonly [MonthKeyMarker]: never };

/**
 * ISO 8601 day of week: `1` = Monday … `7` = Sunday.
 *
 * The same numbering `Temporal.PlainDate#dayOfWeek` uses, so values compare
 * without translation.
 */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * An **inclusive** range of days: `end` is the last day inside the range,
 * not one past it.
 *
 * Build out-of-order endpoints safely with {@link orderedRange}.
 */
export type DateRange = {
  readonly start: Temporal.PlainDate;
  readonly end: Temporal.PlainDate;
};

export type dayKey = (date: Temporal.PlainDate) => DayKey;

export type monthKey = (month: Temporal.PlainYearMonth) => MonthKey;

export type currentDate = (timeZone?: string) => Temporal.PlainDate;

export type isSameDay = (
  a: Temporal.PlainDate,
  b: Temporal.PlainDate,
) => boolean;

export type isSameMonth = (
  a: Temporal.PlainDate,
  b: Temporal.PlainDate,
) => boolean;

export type isBefore = (
  a: Temporal.PlainDate,
  b: Temporal.PlainDate,
) => boolean;

export type isAfter = (a: Temporal.PlainDate, b: Temporal.PlainDate) => boolean;

export type isBetween = (date: Temporal.PlainDate, range: DateRange) => boolean;

export type clampDate = (
  date: Temporal.PlainDate,
  min: Temporal.PlainDate | undefined,
  max: Temporal.PlainDate | undefined,
) => Temporal.PlainDate;

export type startOfWeek = (
  date: Temporal.PlainDate,
  firstDayOfWeek: DayOfWeek,
) => Temporal.PlainDate;

export type endOfWeek = (
  date: Temporal.PlainDate,
  firstDayOfWeek: DayOfWeek,
) => Temporal.PlainDate;

export type daysFrom = (
  start: Temporal.PlainDate,
  count: number,
) => readonly Temporal.PlainDate[];

export type daysInRange = (range: DateRange) => readonly Temporal.PlainDate[];

export type isWeekend = (
  date: Temporal.PlainDate,
  weekendDays: readonly DayOfWeek[],
) => boolean;

export type orderedRange = (
  a: Temporal.PlainDate,
  b: Temporal.PlainDate,
) => DateRange;

export type systemTimeZone = () => string;

// --- Implementation ---

/**
 * Brands a date's ISO string (`YYYY-MM-DD`) as a {@link DayKey}.
 *
 * Two dates produce the same key exactly when {@link isSameDay} holds, which
 * is what makes the key safe for `Map` indexing.
 *
 * @example
 * ```ts
 * dayKey(Temporal.PlainDate.from("2026-07-18")); // "2026-07-18"
 * ```
 */
export const dayKey: dayKey = (date) => date.toString() as DayKey;

/**
 * Brands a month's ISO string (`YYYY-MM`) as a {@link MonthKey}.
 *
 * @example
 * ```ts
 * monthKey(Temporal.PlainYearMonth.from("2026-07")); // "2026-07"
 * ```
 */
export const monthKey: monthKey = (month) => month.toString() as MonthKey;

/**
 * Today in the given time zone.
 *
 * This is the module's clock read. On a server it evaluates with the
 * server's clock — when server- and client-rendered output must agree, pass
 * an explicit `today` into the composables instead of calling this on both
 * sides of the boundary.
 *
 * @param timeZone - IANA identifier such as `"Asia/Tokyo"`.
 * @default the system time zone
 *
 * @example
 * ```ts
 * currentDate();                     // today where the process runs
 * currentDate("Pacific/Kiritimati"); // possibly already tomorrow
 * ```
 */
export const currentDate: currentDate = (timeZone) =>
  timeZone === undefined
    ? Temporal.Now.plainDateISO()
    : Temporal.Now.plainDateISO(timeZone);

/**
 * Whether two dates mark the same day.
 *
 * Calendar-independent: a Hebrew-calendar date and an ISO date that name
 * the same day of history are the same day (`equals` would say no, because
 * it also compares the calendar). Selection state can therefore live in
 * one calendar while the grid renders another.
 */
export const isSameDay: isSameDay = (a, b) =>
  Temporal.PlainDate.compare(a, b) === 0;

/**
 * Whether two dates fall in the same month of the same year.
 *
 * Compares `year` and `month` only, so 2025-07 and 2026-07 are different
 * months while 2026-07-01 and 2026-07-31 are the same one.
 */
export const isSameMonth: isSameMonth = (a, b) =>
  a.year === b.year && a.month === b.month;

/** Whether `a` is strictly before `b`. */
export const isBefore: isBefore = (a, b) =>
  Temporal.PlainDate.compare(a, b) < 0;

/** Whether `a` is strictly after `b`. */
export const isAfter: isAfter = (a, b) => Temporal.PlainDate.compare(a, b) > 0;

/**
 * Whether `date` lies inside the inclusive `range`.
 *
 * Both endpoints count: `isBetween(range.start, range)` and
 * `isBetween(range.end, range)` are always `true`.
 */
export const isBetween: isBetween = (date, range) =>
  Temporal.PlainDate.compare(date, range.start) >= 0 &&
  Temporal.PlainDate.compare(date, range.end) <= 0;

/**
 * Clamps `date` into `[min, max]`.
 *
 * Either bound may be `undefined`, meaning "unbounded on that side"; with
 * both bounds `undefined` the input comes back unchanged. If the bounds
 * cross (`min` after `max`), `min` wins.
 *
 * @example
 * ```ts
 * const min = Temporal.PlainDate.from("2026-07-10");
 * const max = Temporal.PlainDate.from("2026-07-20");
 *
 * clampDate(Temporal.PlainDate.from("2026-07-01"), min, max); // 2026-07-10
 * clampDate(Temporal.PlainDate.from("2026-07-15"), min, max); // unchanged
 * clampDate(Temporal.PlainDate.from("2026-07-15"), undefined, undefined);
 * // unchanged
 * ```
 */
export const clampDate: clampDate = (date, min, max) => {
  if (min !== undefined && Temporal.PlainDate.compare(date, min) < 0) {
    return min;
  }

  if (max !== undefined && Temporal.PlainDate.compare(date, max) > 0) {
    return max;
  }

  return date;
};

/**
 * The first day of the week containing `date`.
 *
 * Idempotent — applying it to a date already at the week start returns that
 * date — and never lands after `date`.
 *
 * @param firstDayOfWeek - Which weekday starts the week (`1` = Monday …
 * `7` = Sunday). Take it from the locale via `localeFirstDayOfWeek`, or fix
 * it explicitly.
 *
 * @example
 * ```ts
 * const saturday = Temporal.PlainDate.from("2026-07-18");
 *
 * startOfWeek(saturday, 1).toString(); // "2026-07-13" — Monday start
 * startOfWeek(saturday, 6).toString(); // "2026-07-18" — already Saturday
 * ```
 */
export const startOfWeek: startOfWeek = (date, firstDayOfWeek) =>
  date.subtract({ days: (date.dayOfWeek - firstDayOfWeek + 7) % 7 });

/**
 * The last day of the week containing `date` — always exactly
 * `startOfWeek(date, firstDayOfWeek)` plus six days.
 */
export const endOfWeek: endOfWeek = (date, firstDayOfWeek) =>
  startOfWeek(date, firstDayOfWeek).add({ days: 6 });

/**
 * `count` consecutive days beginning at `start` (inclusive).
 *
 * A non-positive `count` yields an empty list rather than throwing, so
 * callers can pass computed lengths without guarding.
 *
 * @example
 * ```ts
 * daysFrom(Temporal.PlainDate.from("2026-07-30"), 4).map(String);
 * // ["2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"]
 * ```
 */
export const daysFrom: daysFrom = (start, count) =>
  Array.from({ length: Math.max(count, 0) }, (_, offset) =>
    start.add({ days: offset }),
  );

/**
 * Every day of an inclusive {@link DateRange}, in order.
 *
 * A single-day range (`start` equals `end`) yields one element. The range
 * is assumed ordered — build it with {@link orderedRange} when in doubt.
 */
export const daysInRange: daysInRange = (range) =>
  daysFrom(range.start, range.start.until(range.end).days + 1);

/**
 * Whether `date` falls on one of the given weekend days.
 *
 * The weekend is data, not an assumption: pass `localeWeekendDays(locale)`
 * for the CLDR-derived weekend (Friday–Saturday in several Middle-East
 * locales), or any custom set.
 *
 * @example
 * ```ts
 * isWeekend(friday, [6, 7]); // false — Sat/Sun weekend
 * isWeekend(friday, [5, 6]); // true  — Fri/Sat weekend
 * ```
 */
export const isWeekend: isWeekend = (date, weekendDays) =>
  weekendDays.includes(date.dayOfWeek as DayOfWeek);

/**
 * Builds an inclusive {@link DateRange} from two endpoints given in either
 * order.
 *
 * @example
 * ```ts
 * const range = orderedRange(later, earlier);
 *
 * range.start; // earlier
 * range.end;   // later
 * ```
 */
export const orderedRange: orderedRange = (a, b) =>
  Temporal.PlainDate.compare(a, b) <= 0
    ? { start: a, end: b }
    : { start: b, end: a };

let cachedSystemTimeZone: string | undefined;

/**
 * The system's IANA time zone id, resolved once per process.
 *
 * Two reasons for the cache: the lookup is genuinely expensive with the
 * ponyfill, and a stable value keeps server-rendered output deterministic
 * for the lifetime of the process. The trade-off: a machine that changes
 * time zones mid-process keeps seeing the old zone — pass explicit
 * `timeZone` options where that matters.
 */
export const systemTimeZone: systemTimeZone = () => {
  cachedSystemTimeZone ??= Temporal.Now.timeZoneId();

  return cachedSystemTimeZone;
};
