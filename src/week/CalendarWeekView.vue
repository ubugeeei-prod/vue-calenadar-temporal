<script setup lang="ts">
import { computed } from "vue";
import { useCalendarContext } from "../calendar/context";
import type { CalendarEventLike, NormalizedEvent } from "../events/event";
import type { EventLaneSegment } from "../events/lanes";
import type { TimeGridPlacement } from "../events/time-grid";
import {
  formatDayNumber,
  formatPlainDate,
  formatPlainDateRange,
  formatPlainTime,
} from "../i18n/locale";
import { Temporal } from "../temporal";
import { useNowIndicator } from "./now";
import { useWeekGrid } from "./useWeekGrid";
import type { WeekGridDay } from "./week-grid";

const {
  days = undefined,
  startHour = 0,
  endHour = 24,
  minEventMinutes = undefined,
  maxAllDayLanes = undefined,
  showNowIndicator = true,
} = defineProps<{
  /** Day columns: 7 (default) snaps to the week; 1/3/N roll from the focused date. */
  days?: number;
  /** First rendered hour (inclusive). Default: 0. */
  startHour?: number;
  /** Last rendered hour (exclusive). Default: 24. */
  endHour?: number;
  /** Minimum rendered duration so tiny events stay clickable. */
  minEventMinutes?: number;
  /** Cap stacked lanes in the all-day strip; the rest becomes "+N more". */
  maxAllDayLanes?: number;
  showNowIndicator?: boolean;
}>();

const emit = defineEmits<{
  "click:event": [event: NormalizedEvent<CalendarEventLike>, nativeEvent: MouseEvent];
  "click:slot": [dateTime: Temporal.PlainDateTime, nativeEvent: MouseEvent];
}>();

defineSlots<{
  dayHeader?: (props: { day: WeekGridDay; label: string; weekday: string }) => unknown;
  alldayEvent?: (props: { segment: EventLaneSegment }) => unknown;
  event?: (props: { placement: TimeGridPlacement }) => unknown;
}>();

const { calendar, events, ids } = useCalendarContext();

const { grid, hourLabels } = useWeekGrid(calendar, {
  days: () => days,
  startHour: () => startHour,
  endHour: () => endHour,
});

const now = useNowIndicator({
  timeZone: () => calendar.timeZone.value,
  startHour: () => grid.value.startHour,
  endHour: () => grid.value.endHour,
});

const allDayLanes = computed(() => events.lanesFor(grid.value.range, { maxLanes: maxAllDayLanes }));

const placementsByDay = computed(() =>
  grid.value.days.map((day) =>
    events.placementsFor(day.date, {
      startHour: grid.value.startHour,
      endHour: grid.value.endHour,
      minEventMinutes,
    }),
  ),
);

function weekdayLabel(day: WeekGridDay): string {
  return formatPlainDate(calendar.locale.value, day.date, { weekday: "short" });
}

function headerLabel(day: WeekGridDay): string {
  return formatPlainDate(calendar.locale.value, day.date, { dateStyle: "full" });
}

/** Default chip text: a `title` field when present, otherwise the id. */
function eventText(event: NormalizedEvent<CalendarEventLike>): string {
  const { title } = event.event as { readonly title?: unknown };
  return typeof title === "string" ? title : String(event.id);
}

function timedEventLabel(placement: TimeGridPlacement): string {
  const locale = calendar.locale.value;
  const start = formatPlainTime(locale, placement.event.start.toPlainTime());
  const end = formatPlainTime(locale, placement.event.end.toPlainTime());
  return `${eventText(placement.event)}, ${start} – ${end}`;
}

function allDayEventLabel(segment: EventLaneSegment): string {
  const range = formatPlainDateRange(
    calendar.locale.value,
    segment.event.startDate,
    segment.event.endDate,
  );
  return `${eventText(segment.event)}, ${calendar.messages.value.allDay}, ${range}`;
}

function onSlotClick(day: WeekGridDay, hour: number, nativeEvent: MouseEvent): void {
  emit("click:slot", day.date.toPlainDateTime(new Temporal.PlainTime(hour)), nativeEvent);
}

function nowVisibleOn(day: WeekGridDay): boolean {
  return (
    showNowIndicator &&
    now.fraction.value !== null &&
    now.today.value !== null &&
    day.date.equals(now.today.value)
  );
}

function flag(condition: boolean): "" | undefined {
  return condition ? "" : undefined;
}
</script>

<template>
  <!-- Numeric geometry (day count, lane/column/span, event fractions) flows to
       themes through CSS custom properties on the elements. -->
  <!-- eslint-disable vue/no-inline-style -->
  <div
    data-vct="week-grid"
    :aria-labelledby="ids.title"
    :style="{ '--vct-day-count': grid.days.length }"
  >
    <div data-vct="week-header">
      <div data-vct="gutter-spacer" aria-hidden="true"></div>
      <div
        v-for="day in grid.days"
        :key="day.key"
        data-vct="week-day-header"
        :aria-label="headerLabel(day)"
        :data-today="flag(day.isToday)"
        :data-weekend="flag(day.isWeekend)"
      >
        <slot
          name="dayHeader"
          :day="day"
          :label="formatDayNumber(calendar.locale.value, day.date)"
          :weekday="weekdayLabel(day)"
        >
          <span data-vct="week-day-name">{{ weekdayLabel(day) }}</span>
          <span data-vct="week-day-number">{{
            formatDayNumber(calendar.locale.value, day.date)
          }}</span>
        </slot>
      </div>
    </div>

    <div v-if="allDayLanes.segments.length > 0" data-vct="allday-row">
      <div data-vct="gutter-label">{{ calendar.messages.value.allDay }}</div>
      <div data-vct="allday-lanes" :style="{ '--vct-lane-count': allDayLanes.laneCount }">
        <button
          v-for="segment in allDayLanes.segments"
          :key="segment.event.id"
          type="button"
          data-vct="allday-event"
          :style="{
            '--vct-event-lane': segment.lane,
            '--vct-event-column': segment.startColumn,
            '--vct-event-span': segment.span,
          }"
          :aria-label="allDayEventLabel(segment)"
          :data-continues-before="flag(segment.continuesBefore)"
          :data-continues-after="flag(segment.continuesAfter)"
          @click="(nativeEvent) => emit('click:event', segment.event, nativeEvent)"
        >
          <slot name="alldayEvent" :segment="segment">{{ eventText(segment.event) }}</slot>
        </button>
      </div>
    </div>

    <div data-vct="time-grid">
      <div data-vct="time-gutter" aria-hidden="true">
        <div v-for="entry in hourLabels" :key="entry.hour" data-vct="hour-label">
          {{ entry.label }}
        </div>
      </div>
      <div
        v-for="(day, dayIndex) in grid.days"
        :key="day.key"
        data-vct="day-column"
        :data-today="flag(day.isToday)"
        :data-weekend="flag(day.isWeekend)"
      >
        <div data-vct="hour-slots" aria-hidden="true">
          <button
            v-for="hour in grid.hours"
            :key="hour"
            type="button"
            tabindex="-1"
            data-vct="hour-slot"
            @click="(nativeEvent) => onSlotClick(day, hour, nativeEvent)"
          ></button>
        </div>
        <button
          v-for="placement in placementsByDay[dayIndex] ?? []"
          :key="placement.event.id"
          type="button"
          data-vct="time-event"
          :style="{
            '--vct-event-top': placement.top,
            '--vct-event-height': placement.height,
            '--vct-event-left': placement.left,
            '--vct-event-width': placement.width,
          }"
          :aria-label="timedEventLabel(placement)"
          :data-clip-top="flag(placement.clipTop)"
          :data-clip-bottom="flag(placement.clipBottom)"
          @click="(nativeEvent) => emit('click:event', placement.event, nativeEvent)"
        >
          <slot name="event" :placement="placement">
            <span data-vct="time-event-title">{{ eventText(placement.event) }}</span>
            <span data-vct="time-event-time">{{
              formatPlainTime(calendar.locale.value, placement.event.start.toPlainTime())
            }}</span>
          </slot>
        </button>
        <div
          v-if="nowVisibleOn(day)"
          data-vct="now-line"
          aria-hidden="true"
          :style="{ '--vct-now-fraction': now.fraction.value ?? 0 }"
        ></div>
      </div>
    </div>
  </div>
  <!-- eslint-enable vue/no-inline-style -->
</template>
