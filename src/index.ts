export { Temporal } from "./temporal";

export type { CalendarView } from "./shared/view";
export { CALENDAR_VIEWS } from "./shared/view";

export type { NameStyle, TextDirection } from "./i18n/locale";
export {
  formatDayNumber,
  formatHour,
  formatPlainDate,
  formatPlainDateRange,
  formatPlainTime,
  formatYearMonth,
  getDateTimeFormat,
  localeFirstDayOfWeek,
  localeTextDirection,
  localeWeekendDays,
  monthNames,
  resolveLocale,
  weekdayNames,
} from "./i18n/locale";

export type { CalendarMessages } from "./i18n/messages";
export { englishMessages, mergeMessages } from "./i18n/messages";

export type { MonthGrid, MonthGridDay, MonthGridOptions, MonthGridWeek } from "./month/month-grid";
export { buildMonthGrid } from "./month/month-grid";

export type { WeekGrid, WeekGridDay, WeekGridOptions } from "./week/week-grid";
export { buildWeekGrid } from "./week/week-grid";

export type { YearGrid, YearGridMonth, YearGridOptions } from "./year/year-grid";
export { buildYearGrid } from "./year/year-grid";

export type { DateRange, DayKey, DayOfWeek, MonthKey } from "./shared/date";
export {
  clampDate,
  currentDate,
  dayKey,
  daysFrom,
  daysInRange,
  endOfWeek,
  isAfter,
  isBefore,
  isBetween,
  isSameDay,
  isSameMonth,
  isWeekend,
  monthKey,
  orderedRange,
  startOfWeek,
  systemTimeZone,
} from "./shared/date";

export type {
  CalendarEventDateInput,
  CalendarEventLike,
  EventsByDay,
  NormalizedEvent,
  NormalizeEventsOptions,
} from "./events/event";
export {
  compareEventsForDay,
  eventsOnDay,
  indexEventsByDay,
  normalizeEvent,
  normalizeEvents,
} from "./events/event";

export type { EventLaneLayout, EventLaneOptions, EventLaneSegment } from "./events/lanes";
export { isLaneEvent, layoutEventLanes } from "./events/lanes";

export type { TimeGridOptions, TimeGridPlacement } from "./events/time-grid";
export { layoutTimeGridDay } from "./events/time-grid";

export { canShiftPeriod, periodRange, shiftPeriod } from "./calendar/calendar";

export type {
  DateSelectionMode,
  DateSelectionValue,
  MultipleDateValue,
  RangeDateValue,
  SingleDateValue,
} from "./calendar/selection";
export {
  pickRange,
  rangeEdge,
  rangePreview,
  selectionContains,
  toggleMultiple,
} from "./calendar/selection";

export type { ControllableState } from "./shared/controllable";
export { useControllableState } from "./shared/controllable";

export type { UseCalendarOptions, UseCalendarReturn } from "./calendar/useCalendar";
export { useCalendar } from "./calendar/useCalendar";
