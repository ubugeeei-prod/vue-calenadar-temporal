/**
 * Hand-authored declaration for the generic `DatePickerRoot` component.
 *
 * `vize check --declaration` currently drops `generic` attribute type
 * parameters from the materialized project, so the build task overwrites the
 * emitted file with this one. Remove once the upstream bug is fixed:
 * https://github.com/ubugeeei-prod/vize/issues/3065
 */
import type {
  DateSelectionMode,
  DateSelectionValue,
} from "../calendar/selection";
import type { CalendarEventLike } from "../events/event";
import type { TextDirection } from "../i18n/locale";
import type { CalendarMessages } from "../i18n/messages";
import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";
import type { UseDatePickerReturn } from "./useDatePicker";

/** Props accepted by {@link DatePickerRoot}. */
export type DatePickerRootProps<
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
  /** Popup open state (`v-model:open`). Omit for internal state. */
  open?: boolean;
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
   * IANA time zone used to resolve "today".
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
  /** @default today */
  initialFocusedDate?: Temporal.PlainDate;
  /** @default false */
  initialOpen?: boolean;
  /**
   * Close once a selection is complete (a single pick or a finished range;
   * multiple mode never auto-closes).
   *
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * `Intl` options for the formatted trigger value.
   *
   * @default { dateStyle: "medium" }
   */
  displayFormat?: Intl.DateTimeFormatOptions;
  minDate?: Temporal.PlainDate;
  maxDate?: Temporal.PlainDate;
  /** Extra per-date disabling on top of `minDate` / `maxDate`. */
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /** Optional events, rendered if the popup contains event-aware views. */
  events?: readonly TEvent[];
};

/** Emit payloads exposed as `@update:*` handler props. */
export type DatePickerRootEmits<Mode extends DateSelectionMode = "single"> = {
  "onUpdate:modelValue"?: (value: DateSelectionValue<Mode>) => void;
  "onUpdate:open"?: (open: boolean) => void;
};

export type DatePickerRootSlots<Mode extends DateSelectionMode = "single"> = {
  /** The picker API (calendar + popup state), typed by the root's generics. */
  default?: (props: { picker: UseDatePickerReturn<Mode> }) => unknown;
};

/**
 * Headless date picker root: a calendar plus popup plumbing. Provides both
 * the date-picker context and the calendar context, so plain `Calendar*`
 * parts compose inside {@link DatePickerContent}.
 *
 * @example
 * ```vue
 * <DatePickerRoot v-model="date" locale="ja-JP">
 *   <DatePickerTrigger />
 *   <DatePickerContent />
 * </DatePickerRoot>
 * ```
 */
declare const DatePickerRoot: new <
  Mode extends DateSelectionMode = "single",
  TEvent extends CalendarEventLike = CalendarEventLike,
>(
  props: DatePickerRootProps<Mode, TEvent> & DatePickerRootEmits<Mode>,
) => {
  $props: DatePickerRootProps<Mode, TEvent> & DatePickerRootEmits<Mode>;
  $slots: DatePickerRootSlots<Mode>;
};

export default DatePickerRoot;
