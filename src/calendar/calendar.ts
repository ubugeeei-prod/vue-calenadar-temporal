import type { DateRange, DayOfWeek } from "../shared/date";
import { endOfWeek, startOfWeek } from "../shared/date";
import type { CalendarView } from "../shared/view";
import { Temporal } from "../temporal";

// --- Types & Signatures ---

export type shiftPeriod = (
  view: CalendarView,
  date: Temporal.PlainDate,
  delta: number,
) => Temporal.PlainDate;

/** Natural bounds of the period containing `date` (month, snapped week, year). */
export type periodRange = (
  view: CalendarView,
  date: Temporal.PlainDate,
  firstDayOfWeek: DayOfWeek,
) => DateRange;

/** Whether navigating by `delta` periods stays within `[minDate, maxDate]`. */
export type canShiftPeriod = (
  view: CalendarView,
  date: Temporal.PlainDate,
  delta: number,
  firstDayOfWeek: DayOfWeek,
  minDate: Temporal.PlainDate | undefined,
  maxDate: Temporal.PlainDate | undefined,
) => boolean;

// --- Implementation ---

export const shiftPeriod: shiftPeriod = (view, date, delta) => {
  switch (view) {
    case "month":
      return date.add({ months: delta });
    case "week":
      return date.add({ weeks: delta });
    case "year":
      return date.add({ years: delta });
  }
};

export const periodRange: periodRange = (view, date, firstDayOfWeek) => {
  switch (view) {
    case "month":
      return {
        start: date.with({ day: 1 }),
        end: date.with({ day: date.daysInMonth }),
      };
    case "week":
      return {
        start: startOfWeek(date, firstDayOfWeek),
        end: endOfWeek(date, firstDayOfWeek),
      };
    case "year":
      return {
        start: date.with({ month: 1, day: 1 }),
        end: date.with({ month: date.monthsInYear }).with({ day: 31 }),
      };
  }
};

export const canShiftPeriod: canShiftPeriod = (
  view,
  date,
  delta,
  firstDayOfWeek,
  minDate,
  maxDate,
) => {
  const target = periodRange(view, shiftPeriod(view, date, delta), firstDayOfWeek);
  if (minDate !== undefined && Temporal.PlainDate.compare(target.end, minDate) < 0) return false;
  if (maxDate !== undefined && Temporal.PlainDate.compare(target.start, maxDate) > 0) return false;
  return true;
};
