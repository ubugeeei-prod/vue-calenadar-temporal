import type { DateRange, DayKey, DayOfWeek } from "../shared/date";
import {
  dayKey,
  daysFrom,
  endOfWeek,
  isSameDay,
  isWeekend,
  startOfWeek,
} from "../shared/date";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

/** One cell of a month grid. */
export type MonthGridDay = {
  readonly date: Temporal.PlainDate;
  readonly key: DayKey;
  readonly dayOfWeek: DayOfWeek;
  readonly isToday: boolean;
  /** The cell belongs to a neighboring month shown to fill the week row. */
  readonly isOutside: boolean;
  readonly isWeekend: boolean;
};

/** One row (week) of a month grid. */
export type MonthGridWeek = {
  /**
   * ISO 8601 week number of the row, taken from the row's Thursday so the
   * value stays correct for any first day of week. `undefined` when the
   * calendar system does not define week numbering.
   */
  readonly weekNumber: number | undefined;
  readonly days: readonly MonthGridDay[];
};

export type MonthGrid = {
  readonly month: Temporal.PlainYearMonth;
  readonly weeks: readonly MonthGridWeek[];
  /** First to last visible day, including outside days. */
  readonly range: DateRange;
};

export type MonthGridOptions = {
  readonly month: Temporal.PlainYearMonth;
  readonly today: Temporal.PlainDate;
  readonly firstDayOfWeek: DayOfWeek;
  readonly weekendDays: readonly DayOfWeek[];
  /** Always render six weeks so the grid height stays stable. Default: false. */
  readonly fixedWeekCount?: boolean;
};

export type buildMonthGrid = (options: MonthGridOptions) => MonthGrid;

// --- Implementation ---

const DAYS_PER_WEEK = 7;
const FIXED_WEEK_COUNT = 6;

const ISO_THURSDAY = 4;

export const buildMonthGrid: buildMonthGrid = (options) => {
  const {
    month,
    today,
    firstDayOfWeek,
    weekendDays,
    fixedWeekCount = false,
  } = options;

  const firstOfMonth = month.toPlainDate({ day: 1 });
  const lastOfMonth = month.toPlainDate({ day: month.daysInMonth });
  const gridStart = startOfWeek(firstOfMonth, firstDayOfWeek);
  const naturalEnd = endOfWeek(lastOfMonth, firstDayOfWeek);

  const naturalDayCount = gridStart.until(naturalEnd).days + 1;
  const dayCount = fixedWeekCount
    ? DAYS_PER_WEEK * FIXED_WEEK_COUNT
    : naturalDayCount;
  const days = daysFrom(gridStart, dayCount);

  const weeks: MonthGridWeek[] = [];
  for (let weekStart = 0; weekStart < days.length; weekStart += DAYS_PER_WEEK) {
    const row = days.slice(weekStart, weekStart + DAYS_PER_WEEK);
    const thursday = row.find((date) => date.dayOfWeek === ISO_THURSDAY);
    weeks.push({
      weekNumber: thursday?.weekOfYear,
      days: row.map((date) => ({
        date,
        key: dayKey(date),
        dayOfWeek: date.dayOfWeek as DayOfWeek,
        isToday: isSameDay(date, today),
        isOutside: !(date.year === month.year && date.month === month.month),
        isWeekend: isWeekend(date, weekendDays),
      })),
    });
  }

  const gridEnd = days[days.length - 1] ?? naturalEnd;
  return { month, weeks, range: { start: gridStart, end: gridEnd } };
};
