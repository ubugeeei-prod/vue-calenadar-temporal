<script
  setup
  lang="ts"
  generic="
    Mode extends DateSelectionMode = 'single',
    TEvent extends CalendarEventLike = CalendarEventLike
  "
>
import { useId } from "vue";
import type { CalendarEventLike } from "../events/event";
import type { UseCalendarEventsReturn } from "../events/useCalendarEvents";
import { useCalendarEvents } from "../events/useCalendarEvents";
import type { TextDirection } from "../i18n/locale";
import type { CalendarMessages } from "../i18n/messages";
import type { DayOfWeek } from "../shared/date";
import type { CalendarView } from "../shared/view";
import type { Temporal } from "../temporal";
import type { CalendarContext } from "./context";
import { provideCalendarContext } from "./context";
import type { DateSelectionMode, DateSelectionValue } from "./selection";
import type { UseCalendarReturn } from "./useCalendar";
import { useCalendar } from "./useCalendar";

const {
  selectionMode,
  modelValue = undefined,
  view = undefined,
  locale = undefined,
  calendar: calendarSystem = undefined,
  timeZone = undefined,
  firstDayOfWeek = undefined,
  weekendDays = undefined,
  direction = undefined,
  messages = undefined,
  today = undefined,
  initialView = undefined,
  initialFocusedDate = undefined,
  minDate = undefined,
  maxDate = undefined,
  isDateDisabled = undefined,
  events = undefined,
  defaultEventDurationMinutes = undefined,
} = defineProps<{
  /** Static selection mode; decides the `modelValue` shape. Default: "single". */
  selectionMode?: Mode;
  /** Selected value (v-model). Pass `null`/an array to control; omit for internal state. */
  modelValue?: DateSelectionValue<Mode>;
  /** Current view (v-model:view). Omit for internal state. */
  view?: CalendarView;
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
  initialView?: CalendarView;
  initialFocusedDate?: Temporal.PlainDate;
  minDate?: Temporal.PlainDate;
  maxDate?: Temporal.PlainDate;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /** Events rendered by the views; any extra fields stay typed in slots. */
  events?: readonly TEvent[];
  defaultEventDurationMinutes?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: DateSelectionValue<Mode>];
  "update:view": [view: CalendarView];
}>();

defineSlots<{
  default: (props: {
    calendar: UseCalendarReturn<Mode>;
    events: UseCalendarEventsReturn<TEvent>;
  }) => unknown;
}>();

const calendar = useCalendar<Mode>({
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
  view: () => view,
  onUpdateView: (value) => emit("update:view", value),
  initialView,
  initialFocusedDate,
  minDate: () => minDate,
  maxDate: () => maxDate,
  isDateDisabled: (date) => isDateDisabled?.(date) ?? false,
});

const boundEvents = useCalendarEvents<TEvent>(calendar, () => events ?? [], {
  defaultEventDurationMinutes: () => defaultEventDurationMinutes,
});

provideCalendarContext({
  calendar,
  events: boundEvents,
  ids: { title: useId() },
} as CalendarContext);
</script>

<template>
  <div data-vct="root" :dir="calendar.direction.value">
    <slot :calendar="calendar" :events="boundEvents" />
  </div>
</template>
