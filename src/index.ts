export { Temporal } from "./temporal";

export type { CalendarView } from "./shared/view";
export { CALENDAR_VIEWS } from "./shared/view";

export type { NameStyle, TextDirection } from "./i18n/locale";
export {
  formatDayNumber,
  formatHour,
  formatInteger,
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

export type { GridIntentEffect, GridKeyEventLike, GridKeyIntent } from "./calendar/keyboard";
export { applyGridIntent, resolveGridKey } from "./calendar/keyboard";

export type {
  MonthGridSource,
  UseMonthGridOptions,
  UseMonthGridReturn,
  WeekdayLabel,
} from "./month/useMonthGrid";
export { useMonthGrid } from "./month/useMonthGrid";

export type {
  HourLabel,
  UseWeekGridOptions,
  UseWeekGridReturn,
  WeekGridSource,
} from "./week/useWeekGrid";
export { useWeekGrid } from "./week/useWeekGrid";

export type { LabeledYearGridMonth, UseYearGridReturn, YearGridSource } from "./year/useYearGrid";
export { useYearGrid } from "./year/useYearGrid";

export type {
  CalendarEventsSource,
  UseCalendarEventsOptions,
  UseCalendarEventsReturn,
} from "./events/useCalendarEvents";
export { useCalendarEvents } from "./events/useCalendarEvents";

export type { CalendarContext } from "./calendar/context";
export { CalendarContextKey, provideCalendarContext, useCalendarContext } from "./calendar/context";

export type { RovingFocus } from "./shared/focus";
export { useRovingFocus } from "./shared/focus";

export { default as CalendarRoot } from "./calendar/CalendarRoot.vue";
export { default as CalendarHeader } from "./calendar/CalendarHeader.vue";
export { default as CalendarTitle } from "./calendar/CalendarTitle.vue";
export { default as CalendarPrevButton } from "./calendar/CalendarPrevButton.vue";
export { default as CalendarNextButton } from "./calendar/CalendarNextButton.vue";
export { default as CalendarTodayButton } from "./calendar/CalendarTodayButton.vue";
export { default as CalendarMonthView } from "./month/CalendarMonthView.vue";
export { default as CalendarWeekView } from "./week/CalendarWeekView.vue";
export { default as CalendarYearView } from "./year/CalendarYearView.vue";

export type { NowIndicator, UseNowIndicatorOptions } from "./week/now";
export { axisFraction, useNowIndicator } from "./week/now";

export type { UseDatePickerOptions, UseDatePickerReturn } from "./date-picker/useDatePicker";
export { useDatePicker } from "./date-picker/useDatePicker";

export type { DatePickerContext } from "./date-picker/context";
export {
  DatePickerContextKey,
  provideDatePickerContext,
  useDatePickerContext,
} from "./date-picker/context";

export { default as DatePickerRoot } from "./date-picker/DatePickerRoot.vue";
export { default as DatePickerTrigger } from "./date-picker/DatePickerTrigger.vue";
export { default as DatePickerContent } from "./date-picker/DatePickerContent.vue";
