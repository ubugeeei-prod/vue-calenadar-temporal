import type { DateRange, DayKey, DayOfWeek } from "../shared/date";
import {
  dayKey,
  daysFrom,
  isSameDay,
  isWeekend,
  startOfWeek,
} from "../shared/date";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

/** One day column of a week (time grid) view. */
export type WeekGridDay = {
  readonly date: Temporal.PlainDate;
  readonly key: DayKey;
  readonly dayOfWeek: DayOfWeek;
  readonly isToday: boolean;
  readonly isWeekend: boolean;
};

export type WeekGrid = {
  readonly days: readonly WeekGridDay[];
  /** Hour marks rendered on the time axis, `[startHour, endHour)`. */
  readonly hours: readonly number[];
  readonly startHour: number;
  readonly endHour: number;
  readonly range: DateRange;
};

export type WeekGridOptions = {
  /** Any date inside the period; full weeks snap to the week start. */
  readonly anchor: Temporal.PlainDate;
  readonly today: Temporal.PlainDate;
  readonly firstDayOfWeek: DayOfWeek;
  readonly weekendDays: readonly DayOfWeek[];
  /**
   * Number of day columns. A full week (7, the default) snaps to
   * `firstDayOfWeek`; anything else is a rolling view starting at `anchor`
   * (1 = day view, 3 = mobile-style three-day view).
   */
  readonly days?: number;
  /** First rendered hour (inclusive). Default: 0. */
  readonly startHour?: number;
  /** Last rendered hour (exclusive). Default: 24. */
  readonly endHour?: number;
};

export type buildWeekGrid = (options: WeekGridOptions) => WeekGrid;

// --- Implementation ---

const DAYS_PER_WEEK = 7;
const HOURS_PER_DAY = 24;

export const buildWeekGrid: buildWeekGrid = (options) => {
  const {
    anchor,
    today,
    firstDayOfWeek,
    weekendDays,
    days: dayCount = DAYS_PER_WEEK,
    startHour = 0,
    endHour = HOURS_PER_DAY,
  } = options;

  const count = Math.max(1, Math.trunc(dayCount));
  const start =
    count === DAYS_PER_WEEK ? startOfWeek(anchor, firstDayOfWeek) : anchor;
  const dates = daysFrom(start, count);

  const days = dates.map((date) => ({
    date,
    key: dayKey(date),
    dayOfWeek: date.dayOfWeek as DayOfWeek,
    isToday: isSameDay(date, today),
    isWeekend: isWeekend(date, weekendDays),
  }));

  const firstHour = Math.min(
    Math.max(0, Math.trunc(startHour)),
    HOURS_PER_DAY - 1,
  );
  const lastHour = Math.min(
    Math.max(firstHour + 1, Math.trunc(endHour)),
    HOURS_PER_DAY,
  );
  const hours = Array.from(
    { length: lastHour - firstHour },
    (_, offset) => firstHour + offset,
  );

  const end = dates[dates.length - 1] ?? start;
  return {
    days,
    hours,
    startHour: firstHour,
    endHour: lastHour,
    range: { start, end },
  };
};
