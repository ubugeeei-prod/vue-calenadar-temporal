<script setup lang="ts">
import { useCalendarContext } from "../calendar/context";
import { formatDayNumber, formatPlainDate } from "../i18n/locale";
import type { MonthGridDay } from "../month/month-grid";
import { useMonthGrid } from "../month/useMonthGrid";
import type { Temporal } from "../temporal";
import type { LabeledYearGridMonth } from "./useYearGrid";
import { useYearGrid } from "./useYearGrid";

const { showWeekdays = true, navigateOnDayClick = true } = defineProps<{
  /** Render narrow weekday headers inside each mini month. Default: true. */
  showWeekdays?: boolean;
  /** Clicking a day focuses it and switches to the month view. Default: true. */
  navigateOnDayClick?: boolean;
}>();

const emit = defineEmits<{
  "click:day": [date: Temporal.PlainDate, nativeEvent: MouseEvent];
  "click:month": [month: Temporal.PlainYearMonth, nativeEvent: MouseEvent];
}>();

defineSlots<{
  monthLabel?: (props: { month: LabeledYearGridMonth }) => unknown;
  day?: (props: { day: MonthGridDay; label: string; hasEvents: boolean }) => unknown;
}>();

const { calendar, events, ids } = useCalendarContext();

const { months } = useYearGrid(calendar);
// Mini months share the month grid's localized weekday headers.
const { weekdays } = useMonthGrid(calendar, { weekdayStyle: "narrow" });

function onDayClick(day: MonthGridDay, nativeEvent: MouseEvent): void {
  emit("click:day", day.date, nativeEvent);
  if (!navigateOnDayClick) return;
  calendar.focusDate(day.date);
  calendar.setView("month");
}

function onMonthClick(month: LabeledYearGridMonth, nativeEvent: MouseEvent): void {
  emit("click:month", month.month, nativeEvent);
  if (!navigateOnDayClick) return;
  calendar.focusDate(month.month.toPlainDate({ day: 1 }));
  calendar.setView("month");
}

function dayLabel(day: MonthGridDay): string {
  const date = formatPlainDate(calendar.locale.value, day.date, { dateStyle: "full" });
  const count = events.eventsOn(day.date).length;
  return count === 0 ? date : `${date}, ${calendar.messages.value.events(count)}`;
}

function hasEvents(day: MonthGridDay): boolean {
  return events.eventsOn(day.date).length > 0;
}

function flag(condition: boolean): "" | undefined {
  return condition ? "" : undefined;
}
</script>

<template>
  <div data-vct="year-grid" :aria-labelledby="ids.title">
    <section
      v-for="month in months"
      :key="month.key"
      data-vct="year-month"
      :data-current="flag(month.isCurrent)"
    >
      <button
        type="button"
        data-vct="year-month-label"
        @click="(nativeEvent) => onMonthClick(month, nativeEvent)"
      >
        <slot name="monthLabel" :month="month">{{ month.label }}</slot>
      </button>
      <div data-vct="year-month-grid">
        <div v-if="showWeekdays" data-vct="year-weekdays" aria-hidden="true">
          <span v-for="weekday in weekdays" :key="weekday.dayOfWeek" data-vct="year-weekday">
            {{ weekday.label }}
          </span>
        </div>
        <div
          v-for="(week, weekIndex) in month.grid.weeks"
          :key="week.days[0]?.key ?? weekIndex"
          data-vct="year-week"
        >
          <button
            v-for="day in week.days"
            :key="day.key"
            type="button"
            tabindex="-1"
            data-vct="year-day"
            :aria-label="dayLabel(day)"
            :aria-current="day.isToday ? 'date' : undefined"
            :data-today="flag(day.isToday)"
            :data-outside="flag(day.isOutside)"
            :data-weekend="flag(day.isWeekend)"
            :data-selected="flag(calendar.isSelected(day.date))"
            :data-has-events="flag(hasEvents(day))"
            :disabled="calendar.isDateDisabled(day.date)"
            @click="(nativeEvent) => onDayClick(day, nativeEvent)"
          >
            <slot
              name="day"
              :day="day"
              :label="formatDayNumber(calendar.locale.value, day.date)"
              :has-events="hasEvents(day)"
            >
              {{ formatDayNumber(calendar.locale.value, day.date) }}
            </slot>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
