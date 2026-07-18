import type { DateRange, DayKey } from "../shared/date";
import {
  dayKey,
  daysInRange,
  orderedRange,
  systemTimeZone,
} from "../shared/date";
import { Temporal } from "../temporal";

// --- Types & Signatures ---

/** Accepted `start` / `end` value of a calendar event. */
export type CalendarEventDateInput =
  | Temporal.PlainDate
  | Temporal.PlainDateTime
  | Temporal.ZonedDateTime
  | Temporal.Instant;

/**
 * Minimal contract an event object must satisfy.
 *
 * The library is generic over the concrete event type: extra fields (color,
 * location, …) flow through untouched and come back fully typed in slots and
 * layout results.
 */
export type CalendarEventLike = {
  readonly id: string | number;
  readonly start: CalendarEventDateInput;
  /**
   * Timed events: exclusive end (10:00–11:00 ends at 11:00 sharp).
   * All-day events given as `PlainDate`: inclusive last day.
   * Defaults to one `defaultEventDurationMinutes` slot (timed) or `start`'s
   * day (all-day).
   */
  readonly end?: CalendarEventDateInput;
  /** Forces all-day handling; defaults to `true` when `start` is a `PlainDate`. */
  readonly allDay?: boolean;
};

/** An event resolved to wall-clock time in the display time zone. */
export type NormalizedEvent<
  TEvent extends CalendarEventLike = CalendarEventLike,
> = {
  readonly event: TEvent;
  readonly id: string | number;
  readonly allDay: boolean;
  /** Wall-clock start in the display time zone. */
  readonly start: Temporal.PlainDateTime;
  /** Wall-clock end in the display time zone, exclusive. */
  readonly end: Temporal.PlainDateTime;
  /** First day the event occupies. */
  readonly startDate: Temporal.PlainDate;
  /** Last day the event occupies, inclusive. */
  readonly endDate: Temporal.PlainDate;
  /** Number of days occupied (≥ 1). */
  readonly spanDays: number;
};

export type NormalizeEventsOptions = {
  /**
   * Display time zone used to resolve `Instant` / `ZonedDateTime` inputs.
   * Defaults to the system time zone; pass an explicit id for
   * SSR-deterministic output.
   */
  readonly timeZone?: string;
  /** Duration applied to timed events without `end`. Default: 60. */
  readonly defaultEventDurationMinutes?: number;
};

export type EventsByDay<TEvent extends CalendarEventLike = CalendarEventLike> =
  ReadonlyMap<DayKey, readonly NormalizedEvent<TEvent>[]>;

export type normalizeEvent = <TEvent extends CalendarEventLike>(
  event: TEvent,
  options?: NormalizeEventsOptions,
) => NormalizedEvent<TEvent>;
export type normalizeEvents = <TEvent extends CalendarEventLike>(
  events: readonly TEvent[],
  options?: NormalizeEventsOptions,
) => readonly NormalizedEvent<TEvent>[];
export type compareEventsForDay = (
  a: NormalizedEvent,
  b: NormalizedEvent,
) => number;
export type indexEventsByDay = <TEvent extends CalendarEventLike>(
  events: readonly NormalizedEvent<TEvent>[],
  range: DateRange,
) => EventsByDay<TEvent>;
export type eventsOnDay = <TEvent extends CalendarEventLike>(
  index: EventsByDay<TEvent>,
  date: Temporal.PlainDate,
) => readonly NormalizedEvent<TEvent>[];

// --- Implementation ---

const DEFAULT_DURATION_MINUTES = 60;

const MIDNIGHT = new Temporal.PlainTime();

/**
 * Values may come from another copy of the polyfill (or native Temporal), so
 * kinds are detected structurally and rebuilt through ISO strings only when
 * they are foreign.
 */
type DateTimeKind = "instant" | "zoned" | "date-time" | "date";

const kindOf = (value: CalendarEventDateInput): DateTimeKind => {
  if (value instanceof Temporal.PlainDate) return "date";
  if (value instanceof Temporal.PlainDateTime) return "date-time";
  if (value instanceof Temporal.ZonedDateTime) return "zoned";
  if (value instanceof Temporal.Instant) return "instant";
  const shape = value as Partial<
    Record<"timeZoneId" | "epochNanoseconds" | "hour", unknown>
  >;
  if (shape.timeZoneId !== undefined) return "zoned";
  if (shape.epochNanoseconds !== undefined) return "instant";
  if (shape.hour !== undefined) return "date-time";
  return "date";
};

/** Wall-clock date-time of `value` in `timeZone`, plus whether it was date-only. */
const toWallClock = (
  value: CalendarEventDateInput,
  timeZone: string,
): {
  readonly dateTime: Temporal.PlainDateTime;
  readonly dateOnly: boolean;
} => {
  switch (kindOf(value)) {
    case "instant": {
      const instant =
        value instanceof Temporal.Instant
          ? value
          : Temporal.Instant.from(value.toString());
      return {
        dateTime: instant.toZonedDateTimeISO(timeZone).toPlainDateTime(),
        dateOnly: false,
      };
    }
    case "zoned": {
      const zoned =
        value instanceof Temporal.ZonedDateTime
          ? value
          : Temporal.ZonedDateTime.from(value.toString());
      return {
        dateTime: zoned.withTimeZone(timeZone).toPlainDateTime(),
        dateOnly: false,
      };
    }
    case "date-time": {
      const dateTime =
        value instanceof Temporal.PlainDateTime
          ? value
          : Temporal.PlainDateTime.from(value.toString());
      return { dateTime, dateOnly: false };
    }
    case "date": {
      const date =
        value instanceof Temporal.PlainDate
          ? value
          : Temporal.PlainDate.from(value.toString());
      return { dateTime: date.toPlainDateTime(MIDNIGHT), dateOnly: true };
    }
  }
};

export const normalizeEvent: normalizeEvent = (event, options) => {
  const timeZone = options?.timeZone ?? systemTimeZone();
  const defaultDuration =
    options?.defaultEventDurationMinutes ?? DEFAULT_DURATION_MINUTES;

  const start = toWallClock(event.start, timeZone);
  const end =
    event.end === undefined ? undefined : toWallClock(event.end, timeZone);
  const allDay = event.allDay ?? start.dateOnly;

  if (allDay) {
    const range = orderedRange(
      start.dateTime.toPlainDate(),
      (end?.dateTime ?? start.dateTime).toPlainDate(),
    );
    return {
      event,
      id: event.id,
      allDay: true,
      start: range.start.toPlainDateTime(MIDNIGHT),
      end: range.end.add({ days: 1 }).toPlainDateTime(MIDNIGHT),
      startDate: range.start,
      endDate: range.end,
      spanDays: range.start.until(range.end).days + 1,
    };
  }

  const startDateTime = start.dateTime;
  const rawEnd =
    end?.dateTime ?? startDateTime.add({ minutes: defaultDuration });
  const ordered = Temporal.PlainDateTime.compare(rawEnd, startDateTime) < 0;
  const startAt = ordered ? rawEnd : startDateTime;
  const endAt = ordered ? startDateTime : rawEnd;

  const startDate = startAt.toPlainDate();
  const endsAtMidnight =
    endAt.toPlainTime().equals(MIDNIGHT) &&
    Temporal.PlainDateTime.compare(endAt, startAt) > 0;
  const endDate = endsAtMidnight
    ? endAt.toPlainDate().subtract({ days: 1 })
    : endAt.toPlainDate();

  return {
    event,
    id: event.id,
    allDay: false,
    start: startAt,
    end: endAt,
    startDate,
    endDate,
    spanDays: startDate.until(endDate).days + 1,
  };
};

export const normalizeEvents: normalizeEvents = (events, options) => {
  const timeZone = options?.timeZone ?? systemTimeZone();
  return events.map((event) => normalizeEvent(event, { ...options, timeZone }));
};

/**
 * Display order within a day: all-day and multi-day spans first, then by
 * start time, longer events first, id as the stable tiebreaker.
 */
export const compareEventsForDay: compareEventsForDay = (a, b) => {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  if (a.spanDays !== b.spanDays) return b.spanDays - a.spanDays;
  const byStart = Temporal.PlainDateTime.compare(a.start, b.start);
  if (byStart !== 0) return byStart;
  const byEnd = Temporal.PlainDateTime.compare(b.end, a.end);
  if (byEnd !== 0) return byEnd;
  return String(a.id) < String(b.id) ? -1 : 1;
};

export const indexEventsByDay: indexEventsByDay = <
  TEvent extends CalendarEventLike,
>(
  events: readonly NormalizedEvent<TEvent>[],
  range: DateRange,
) => {
  const index = new Map<DayKey, NormalizedEvent<TEvent>[]>();
  for (const event of events) {
    if (
      Temporal.PlainDate.compare(event.endDate, range.start) < 0 ||
      Temporal.PlainDate.compare(event.startDate, range.end) > 0
    ) {
      continue;
    }
    const visible = orderedRange(
      Temporal.PlainDate.compare(event.startDate, range.start) < 0
        ? range.start
        : event.startDate,
      Temporal.PlainDate.compare(event.endDate, range.end) > 0
        ? range.end
        : event.endDate,
    );
    for (const day of daysInRange(visible)) {
      const key = dayKey(day);
      const list = index.get(key);
      if (list === undefined) index.set(key, [event]);
      else list.push(event);
    }
  }
  for (const list of index.values()) list.sort(compareEventsForDay);
  return index;
};

export const eventsOnDay: eventsOnDay = (index, date) =>
  index.get(dayKey(date)) ?? [];
