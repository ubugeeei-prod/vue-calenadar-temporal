import { Temporal } from "../temporal";

// --- Types & Signatures ---

declare const DayKeyMarker: unique symbol;
/** Nominal key for a calendar day (ISO `YYYY-MM-DD`), safe for Map indexing. */
export type DayKey = string & { readonly [DayKeyMarker]: never };

declare const MonthKeyMarker: unique symbol;
/** Nominal key for a calendar month (ISO `YYYY-MM`). */
export type MonthKey = string & { readonly [MonthKeyMarker]: never };

/** ISO day of week: 1 = Monday … 7 = Sunday. */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Inclusive date range. */
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

export const dayKey: dayKey = (date) => date.toString() as DayKey;

export const monthKey: monthKey = (month) => month.toString() as MonthKey;

/**
 * Today in the given (or system) time zone.
 *
 * On the server this evaluates with the server clock; pass an explicit `today`
 * to the composables when the rendered output must match across
 * server and client boundaries.
 */
export const currentDate: currentDate = (timeZone) =>
  timeZone === undefined
    ? Temporal.Now.plainDateISO()
    : Temporal.Now.plainDateISO(timeZone);

export const isSameDay: isSameDay = (a, b) => a.equals(b);

export const isSameMonth: isSameMonth = (a, b) =>
  a.year === b.year && a.month === b.month;

export const isBefore: isBefore = (a, b) =>
  Temporal.PlainDate.compare(a, b) < 0;

export const isAfter: isAfter = (a, b) => Temporal.PlainDate.compare(a, b) > 0;

export const isBetween: isBetween = (date, range) =>
  Temporal.PlainDate.compare(date, range.start) >= 0 &&
  Temporal.PlainDate.compare(date, range.end) <= 0;

export const clampDate: clampDate = (date, min, max) => {
  if (min !== undefined && Temporal.PlainDate.compare(date, min) < 0)
    return min;
  if (max !== undefined && Temporal.PlainDate.compare(date, max) > 0)
    return max;
  return date;
};

export const startOfWeek: startOfWeek = (date, firstDayOfWeek) =>
  date.subtract({ days: (date.dayOfWeek - firstDayOfWeek + 7) % 7 });

export const endOfWeek: endOfWeek = (date, firstDayOfWeek) =>
  startOfWeek(date, firstDayOfWeek).add({ days: 6 });

export const daysFrom: daysFrom = (start, count) =>
  Array.from({ length: Math.max(count, 0) }, (_, offset) =>
    start.add({ days: offset }),
  );

export const daysInRange: daysInRange = (range) =>
  daysFrom(range.start, range.start.until(range.end).days + 1);

export const isWeekend: isWeekend = (date, weekendDays) =>
  weekendDays.includes(date.dayOfWeek as DayOfWeek);

/** Normalizes two dates into an ordered inclusive range. */
export const orderedRange: orderedRange = (a, b) =>
  Temporal.PlainDate.compare(a, b) <= 0
    ? { start: a, end: b }
    : { start: b, end: a };

let cachedSystemTimeZone: string | undefined;

/**
 * The system time zone id, resolved once per process.
 *
 * Looking it up is expensive with the ponyfill, and a stable value also keeps
 * server-rendered output deterministic within a process. Pass explicit
 * `timeZone` options when you need a different zone.
 */
export const systemTimeZone: systemTimeZone = () => {
  cachedSystemTimeZone ??= Temporal.Now.timeZoneId();
  return cachedSystemTimeZone;
};
