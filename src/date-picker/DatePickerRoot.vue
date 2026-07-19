<script
  setup
  lang="ts"
  generic="
    Mode extends DateSelectionMode = 'single',
    TEvent extends CalendarEventLike = CalendarEventLike
  "
>
import { shallowRef, useId } from "vue";
import type { CalendarContext } from "../calendar/context";
import { provideCalendarContext } from "../calendar/context";
import type {
  DateSelectionMode,
  DateSelectionValue,
} from "../calendar/selection";
import type { CalendarEventLike } from "../events/event";
import { useCalendarEvents } from "../events/useCalendarEvents";
import type { TextDirection } from "../i18n/locale";
import type { CalendarMessages } from "../i18n/messages";
import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";
import type { DatePickerContext } from "./context";
import { provideDatePickerContext } from "./context";
import type { UseDatePickerReturn } from "./useDatePicker";
import { useDatePicker } from "./useDatePicker";

const {
  selectionMode,
  modelValue = undefined,
  open = undefined,
  locale = undefined,
  calendar: calendarSystem = undefined,
  timeZone = undefined,
  firstDayOfWeek = undefined,
  weekendDays = undefined,
  direction = undefined,
  messages = undefined,
  today = undefined,
  initialFocusedDate = undefined,
  initialOpen = undefined,
  closeOnSelect = undefined,
  displayFormat = undefined,
  minDate = undefined,
  maxDate = undefined,
  isDateDisabled = undefined,
  events = undefined,
} = defineProps<{
  /** Static selection mode; decides the `modelValue` shape. Default: "single". */
  selectionMode?: Mode;
  /** Selected value (v-model). Pass `null`/an array to control; omit for internal state. */
  modelValue?: DateSelectionValue<Mode>;
  /** Popup open state (v-model:open). Omit for internal state. */
  open?: boolean;
  locale?: string | Intl.Locale;
  /**
   * Temporal calendar system (`"hebrew"`, `"islamic-umalqura"`, …).
   * Defaults to the locale's `-u-ca-` extension, else ISO 8601. Non-ISO
   * systems beyond `gregory` need the `vue-calendar-temporal/full` build.
   */
  calendar?: string;
  timeZone?: string;
  firstDayOfWeek?: DayOfWeek;
  weekendDays?: readonly DayOfWeek[];
  direction?: TextDirection;
  messages?: Partial<CalendarMessages>;
  /** Explicit "today" for deterministic SSR output. */
  today?: Temporal.PlainDate;
  initialFocusedDate?: Temporal.PlainDate;
  initialOpen?: boolean;
  /** Close once a selection is complete. Default: true. */
  closeOnSelect?: boolean;
  /** `Intl` options for the formatted trigger value. */
  displayFormat?: Intl.DateTimeFormatOptions;
  minDate?: Temporal.PlainDate;
  maxDate?: Temporal.PlainDate;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /** Optional events, rendered if the popup contains event-aware views. */
  events?: readonly TEvent[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: DateSelectionValue<Mode>];
  "update:open": [open: boolean];
}>();

defineSlots<{
  default: (props: { picker: UseDatePickerReturn<Mode> }) => unknown;
}>();

const picker = useDatePicker<Mode>({
  locale: () => locale,
  calendar: () => calendarSystem,
  timeZone: () => timeZone,
  firstDayOfWeek: () => firstDayOfWeek,
  weekendDays: () => weekendDays,
  direction: () => direction,
  messages: () => messages,
  today: () => today,
  selectionMode,
  selected: () => modelValue,
  onUpdateSelected: (value) => emit("update:modelValue", value),
  open: () => open,
  onUpdateOpen: (value) => emit("update:open", value),
  initialOpen,
  closeOnSelect,
  displayFormat,
  initialFocusedDate,
  minDate: () => minDate,
  maxDate: () => maxDate,
  isDateDisabled: (date) => isDateDisabled?.(date) ?? false,
});

const boundEvents = useCalendarEvents<TEvent>(
  picker.calendar,
  () => events ?? [],
);

// The popup hosts plain Calendar parts: the picker's calendar IS the context.
provideCalendarContext({
  calendar: picker.calendar,
  events: boundEvents,
  ids: { title: useId() },
} as CalendarContext);

provideDatePickerContext({
  picker,
  ids: { trigger: useId(), dialog: useId() },
  triggerElement: shallowRef<HTMLElement | null>(null),
} as DatePickerContext);
</script>

<template>
  <div data-vct="date-picker" :dir="picker.calendar.direction.value">
    <slot :picker="picker" />
  </div>
</template>
