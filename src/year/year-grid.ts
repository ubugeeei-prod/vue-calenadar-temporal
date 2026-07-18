import type { MonthGrid } from "../month/month-grid";
import { buildMonthGrid } from "../month/month-grid";
import type { DateRange, DayOfWeek, MonthKey } from "../shared/date";
import { monthKey } from "../shared/date";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

/** One mini-month of a year view. */
export type YearGridMonth = {
  readonly month: Temporal.PlainYearMonth;
  readonly key: MonthKey;
  /** Contains today. */
  readonly isCurrent: boolean;
  /** Six-week mini grid so every month renders with a uniform height. */
  readonly grid: MonthGrid;
};

export type YearGrid = {
  readonly year: number;
  readonly months: readonly YearGridMonth[];
  readonly range: DateRange;
};

export type YearGridOptions = {
  /** Any date inside the year to render. */
  readonly anchor: Temporal.PlainDate;
  readonly today: Temporal.PlainDate;
  readonly firstDayOfWeek: DayOfWeek;
  readonly weekendDays: readonly DayOfWeek[];
};

export type buildYearGrid = (options: YearGridOptions) => YearGrid;

// --- Implementation ---

export const buildYearGrid: buildYearGrid = (options) => {
  const { anchor, today, firstDayOfWeek, weekendDays } = options;

  const months = Array.from({ length: anchor.monthsInYear }, (_, index) => {
    const month = anchor.with({ month: index + 1, day: 1 }).toPlainYearMonth();
    return {
      month,
      key: monthKey(month),
      isCurrent: today.year === month.year && today.month === month.month,
      grid: buildMonthGrid({ month, today, firstDayOfWeek, weekendDays, fixedWeekCount: true }),
    };
  });

  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  return {
    year: anchor.year,
    months,
    range: {
      start: firstMonth?.month.toPlainDate({ day: 1 }) ?? anchor,
      end: lastMonth?.month.toPlainDate({ day: lastMonth.month.daysInMonth }) ?? anchor,
    },
  };
};
