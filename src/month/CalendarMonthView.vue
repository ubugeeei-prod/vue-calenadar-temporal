<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useCalendarContext } from "../calendar/context";
import { applyGridIntent, resolveGridKey } from "../calendar/keyboard";
import type { CalendarEventLike, NormalizedEvent } from "../events/event";
import type { EventLaneLayout, EventLaneSegment } from "../events/lanes";
import type { NameStyle } from "../i18n/locale";
import {
  formatDayNumber,
  formatInteger,
  formatPlainDate,
} from "../i18n/locale";
import { isBetween } from "../shared/date";
import { useRovingFocus } from "../shared/focus";
import type { MonthGridDay, MonthGridWeek } from "./month-grid";
import { useMonthGrid } from "./useMonthGrid";

const {
  fixedWeekCount = false,
  weekdayStyle = "short",
  showWeekNumbers = false,
  maxEventLanes = undefined,
  rangeDragSelect = true,
} = defineProps<{
  /**
   * Always render six weeks for a stable height.
   *
   * @default false
   */
  fixedWeekCount?: boolean;
  /**
   * Weekday header style.
   *
   * @default "short"
   */
  weekdayStyle?: NameStyle;
  /** @default false */
  showWeekNumbers?: boolean;
  /** Cap stacked event lanes per week; the rest becomes "+N more". */
  maxEventLanes?: number;
  /**
   * In range mode, press a day and drag to sweep out the range in one
   * gesture (the click–click flow keeps working alongside). Set `false`
   * to allow only the two-click flow.
   *
   * @default true
   */
  rangeDragSelect?: boolean;
}>();

const emit = defineEmits<{
  "click:event": [
    event: NormalizedEvent<CalendarEventLike>,
    nativeEvent: MouseEvent,
  ];
}>();

defineSlots<{
  day?: (props: {
    day: MonthGridDay;
    label: string;
    dayEvents: readonly NormalizedEvent<CalendarEventLike>[];
  }) => unknown;
  event?: (props: { segment: EventLaneSegment; day: MonthGridDay }) => unknown;
}>();

const { calendar, events, ids } = useCalendarContext();

const { grid, weekdays } = useMonthGrid(calendar, {
  fixedWeekCount: () => fixedWeekCount,
  weekdayStyle: () => weekdayStyle,
});

const weekLanes = computed<readonly EventLaneLayout<CalendarEventLike>[]>(() =>
  grid.value.weeks.map((week) => {
    const first = week.days[0];
    const last = week.days[week.days.length - 1];
    if (first === undefined || last === undefined)
      return { segments: [], laneCount: 0, overflow: [], hiddenEvents: [] };
    return events.lanesFor(
      { start: first.date, end: last.date },
      { maxLanes: maxEventLanes },
    );
  }),
);

const root = useTemplateRef<HTMLElement>("root");
const roving = useRovingFocus(root);

function onKeydown(keyboardEvent: KeyboardEvent): void {
  const intent = resolveGridKey(keyboardEvent, calendar.direction.value);
  if (intent === undefined) return;
  keyboardEvent.preventDefault();
  const effect = applyGridIntent(
    intent,
    calendar.focusedDate.value,
    calendar.firstDayOfWeek.value,
  );
  if (effect.focus !== undefined) {
    calendar.focusDate(effect.focus);
    // Roving focus lands on the new cell, whose @focus mirrors pointer hover.
    void roving.focusActive();
  }
  if (effect.select === true) calendar.select(calendar.focusedDate.value);
}

function clearHover(): void {
  calendar.hoverDate(null);
}

// Drag state is handler-local plumbing — deliberately not reactive.
let dragActive = false;
let dragStartKey: string | null = null;

function dragEnabled(): boolean {
  return rangeDragSelect && calendar.selectionMode === "range";
}

function onDayClick(day: MonthGridDay): void {
  // With dragging on, the pointer handlers own range selection; the click
  // that follows pointerup must not double-fire it.
  if (dragEnabled()) return;
  calendar.select(day.date);
}

function onDayPointerDown(day: MonthGridDay, pointerEvent: PointerEvent): void {
  if (!dragEnabled() || pointerEvent.button !== 0) return;
  if (calendar.isDateDisabled(day.date)) return;

  // Begins the pending range — or completes it when one is already open
  // (which is exactly the second half of the click–click flow).
  calendar.select(day.date);
  dragActive = calendar.pendingRangeStart.value !== null;
  dragStartKey = day.key;
}

function onDayPointerUp(day: MonthGridDay): void {
  if (!dragEnabled() || !dragActive) return;
  dragActive = false;

  const swept = day.key !== dragStartKey;
  dragStartKey = null;
  if (swept && calendar.pendingRangeStart.value !== null) {
    calendar.select(day.date);
  }
}

function onGridPointerLeave(): void {
  dragActive = false;
  dragStartKey = null;
  clearHover();
}

function segmentsStartingAt(
  weekIndex: number,
  column: number,
): readonly EventLaneSegment<CalendarEventLike>[] {
  const lanes = weekLanes.value[weekIndex];
  if (lanes === undefined) return [];
  return lanes.segments.filter((segment) => segment.startColumn === column);
}

function overflowAt(weekIndex: number, column: number): number {
  return weekLanes.value[weekIndex]?.overflow[column] ?? 0;
}

function cellLabel(day: MonthGridDay): string {
  const date = formatPlainDate(calendar.locale.value, day.date, {
    dateStyle: "full",
  });
  const count = events.eventsOn(day.date).length;
  return count === 0
    ? date
    : `${date}, ${calendar.messages.value.events(count)}`;
}

function previewContains(day: MonthGridDay): boolean {
  const preview = calendar.previewRange.value;
  return preview !== null && isBetween(day.date, preview);
}

/** Default chip text: a `title` field when present, otherwise the id. */
function eventText(segment: EventLaneSegment<CalendarEventLike>): string {
  const { title } = segment.event.event as { readonly title?: unknown };
  return typeof title === "string" ? title : String(segment.event.id);
}

function weekNumberLabel(week: MonthGridWeek): string {
  return week.weekNumber === undefined
    ? ""
    : formatInteger(calendar.locale.value, week.weekNumber);
}

function flag(condition: boolean): "" | undefined {
  return condition ? "" : undefined;
}
</script>

<template>
  <!-- The grid container is interactive by delegation: cells carry the roving
       tabindex and their key events bubble here (APG grid pattern). -->
  <!-- eslint-disable-next-line a11y/no-static-element-interactions -->
  <div
    ref="root"
    role="grid"
    data-vct="month-grid"
    :aria-labelledby="ids.title"
    :aria-multiselectable="
      calendar.selectionMode === 'single' ? undefined : 'true'
    "
    @keydown="onKeydown"
    @pointerleave="onGridPointerLeave"
    @blur.capture="clearHover"
  >
    <div role="row" data-vct="weekdays-row">
      <div
        v-if="showWeekNumbers"
        role="columnheader"
        data-vct="weeknumber-columnheader"
      >
        <span aria-hidden="true">{{
          calendar.messages.value.weekNumberColumn
        }}</span>
      </div>
      <div
        v-for="weekday in weekdays"
        :key="weekday.dayOfWeek"
        role="columnheader"
        data-vct="weekday-columnheader"
        :aria-label="weekday.fullName"
        :data-weekend="
          flag(calendar.weekendDays.value.includes(weekday.dayOfWeek))
        "
      >
        {{ weekday.label }}
      </div>
    </div>

    <div
      v-for="(week, weekIndex) in grid.weeks"
      :key="week.days[0]?.key ?? weekIndex"
      role="row"
      data-vct="week-row"
    >
      <div
        v-if="showWeekNumbers"
        role="rowheader"
        data-vct="weeknumber"
        :aria-label="
          week.weekNumber === undefined
            ? undefined
            : calendar.messages.value.weekNumber(week.weekNumber)
        "
      >
        {{ weekNumberLabel(week) }}
      </div>
      <!-- Focusability is the roving tabindex (0 on the focused date, -1
           elsewhere), which the static check cannot see. -->
      <!-- eslint-disable-next-line a11y/interactive-supports-focus -->
      <div
        v-for="(day, columnIndex) in week.days"
        :key="day.key"
        role="gridcell"
        data-vct="day"
        :tabindex="day.date.equals(calendar.focusedDate.value) ? 0 : -1"
        :aria-selected="calendar.isSelected(day.date)"
        :aria-disabled="calendar.isDateDisabled(day.date) || undefined"
        :aria-current="day.isToday ? 'date' : undefined"
        :aria-label="cellLabel(day)"
        :data-today="flag(day.isToday)"
        :data-outside="flag(day.isOutside)"
        :data-weekend="flag(day.isWeekend)"
        :data-selected="flag(calendar.isSelected(day.date))"
        :data-disabled="flag(calendar.isDateDisabled(day.date))"
        :data-range-edge="calendar.rangeEdgeOf(day.date) ?? undefined"
        :data-preview="flag(previewContains(day))"
        @click="() => onDayClick(day)"
        @pointerdown="(pointerEvent) => onDayPointerDown(day, pointerEvent)"
        @pointerup="() => onDayPointerUp(day)"
        @mouseenter="() => calendar.hoverDate(day.date)"
        @focus="() => calendar.hoverDate(day.date)"
      >
        <slot
          name="day"
          :day="day"
          :label="formatDayNumber(calendar.locale.value, day.date)"
          :day-events="events.eventsOn(day.date)"
        >
          <span data-vct="day-number">{{
            formatDayNumber(calendar.locale.value, day.date)
          }}</span>
        </slot>
        <div data-vct="day-events" aria-hidden="true">
          <!-- Lane/span are per-segment numeric geometry; custom properties on
               the element are the CSS-variable channel themes consume. -->
          <!-- eslint-disable vue/no-inline-style -->
          <button
            v-for="segment in segmentsStartingAt(weekIndex, columnIndex)"
            :key="segment.event.id"
            type="button"
            tabindex="-1"
            data-vct="event-chip"
            :style="{
              '--vct-event-lane': segment.lane,
              '--vct-event-span': segment.span,
            }"
            :data-all-day="flag(segment.event.allDay)"
            :data-continues-before="flag(segment.continuesBefore)"
            :data-continues-after="flag(segment.continuesAfter)"
            @click.stop="
              (nativeEvent) => emit('click:event', segment.event, nativeEvent)
            "
          >
            <slot name="event" :segment="segment" :day="day">{{
              eventText(segment)
            }}</slot>
          </button>
          <!-- eslint-enable vue/no-inline-style -->
          <span
            v-if="overflowAt(weekIndex, columnIndex) > 0"
            data-vct="event-overflow"
          >
            {{
              calendar.messages.value.moreEvents(
                overflowAt(weekIndex, columnIndex),
              )
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
