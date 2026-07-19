/**
 * Hand-authored declaration for the generic `CalendarRoot` component.
 *
 * `vize check --declaration` currently drops `generic` attribute type
 * parameters from the materialized project, so the build task overwrites the
 * emitted file with this one. Remove once the upstream bug is fixed:
 * https://github.com/ubugeeei-prod/vize/issues/3065
 */
import type { CalendarEventLike } from "../events/event";
import type { UseCalendarEventsReturn } from "../events/useCalendarEvents";
import type { TextDirection } from "../i18n/locale";
import type { CalendarMessages } from "../i18n/messages";
import type { DayOfWeek } from "../shared/date";
import type { CalendarView } from "../shared/view";
import type { Temporal } from "../temporal";
import type { DateSelectionMode, DateSelectionValue } from "./selection";
import type { UseCalendarReturn } from "./useCalendar";

/** Props accepted by {@link CalendarRoot}. */
export type CalendarRootProps<
  Mode extends DateSelectionMode = "single",
  TEvent extends CalendarEventLike = CalendarEventLike,
> = {
  /**
   * Static selection mode; decides the `modelValue` shape.
   *
   * @default "single"
   */
  selectionMode?: Mode;
  /**
   * Selected value (`v-model`). Pass `null` / an array to control; omit for
   * internal state.
   */
  modelValue?: DateSelectionValue<Mode>;
  /** Current view (`v-model:view`). Omit for internal state. */
  view?: CalendarView;
  /**
   * BCP-47 tag or `Intl.Locale`.
   *
   * @default the runtime locale
   */
  locale?: string | Intl.Locale;
  /**
   * Temporal calendar system (`"hebrew"`, `"islamic-umalqura"`, …).
   *
   * @default the locale's `-u-ca-` extension, else "iso8601"
   */
  calendar?: string;
  /**
   * IANA time zone used to resolve "today" and absolute event times.
   *
   * @default the system time zone
   */
  timeZone?: string;
  /** @default the locale's first day of week */
  firstDayOfWeek?: DayOfWeek;
  /** @default the locale's weekend days */
  weekendDays?: readonly DayOfWeek[];
  /** @default the locale's script direction */
  direction?: TextDirection;
  /** Partial overrides merged over the English defaults. */
  messages?: Partial<CalendarMessages>;
  /**
   * Explicit "today" for deterministic SSR output.
   *
   * @default the current date in `timeZone`, evaluated once at setup
   */
  today?: Temporal.PlainDate;
  /** @default "month" */
  initialView?: CalendarView;
  /** @default today */
  initialFocusedDate?: Temporal.PlainDate;
  minDate?: Temporal.PlainDate;
  maxDate?: Temporal.PlainDate;
  /** Extra per-date disabling on top of `minDate` / `maxDate`. */
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /** Events rendered by the views; any extra fields stay typed in slots. */
  events?: readonly TEvent[];
  /**
   * Duration for timed events without an explicit end, in minutes.
   *
   * @default 60
   */
  defaultEventDurationMinutes?: number;
};

/** Emit payloads exposed as `@update:*` handler props. */
export type CalendarRootEmits<Mode extends DateSelectionMode = "single"> = {
  "onUpdate:modelValue"?: (value: DateSelectionValue<Mode>) => void;
  "onUpdate:view"?: (view: CalendarView) => void;
};

export type CalendarRootSlots<
  Mode extends DateSelectionMode = "single",
  TEvent extends CalendarEventLike = CalendarEventLike,
> = {
  /** Full calendar and event APIs, typed by the root's generics. */
  default?: (props: {
    calendar: UseCalendarReturn<Mode>;
    events: UseCalendarEventsReturn<TEvent>;
  }) => unknown;
};

/**
 * Headless calendar root: owns the calendar state, binds events, and provides
 * the context every other `Calendar*` part consumes.
 *
 * @example
 * ```vue
 * <CalendarRoot v-model="selected" :events="events" locale="ja-JP">
 *   <CalendarHeader>
 *     <CalendarPrevButton />
 *     <CalendarTitle />
 *     <CalendarNextButton />
 *   </CalendarHeader>
 *   <CalendarMonthView />
 * </CalendarRoot>
 * ```
 */
declare const CalendarRoot: new <
  Mode extends DateSelectionMode = "single",
  TEvent extends CalendarEventLike = CalendarEventLike,
>(
  props: CalendarRootProps<Mode, TEvent> & CalendarRootEmits<Mode>,
) => {
  $props: CalendarRootProps<Mode, TEvent> & CalendarRootEmits<Mode>;
  $slots: CalendarRootSlots<Mode, TEvent>;
};

export default CalendarRoot;
