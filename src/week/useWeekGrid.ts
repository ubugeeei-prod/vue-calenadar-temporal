import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { formatHour } from "../i18n/locale";
import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";
import type { WeekGrid } from "./week-grid";
import { buildWeekGrid } from "./week-grid";

// --- Types & Signatures ---

/** The state slice a week grid needs; `UseCalendarReturn` satisfies it. */
export type WeekGridSource = {
  readonly locale: MaybeRefOrGetter<string>;
  readonly focusedDate: MaybeRefOrGetter<Temporal.PlainDate>;
  readonly today: MaybeRefOrGetter<Temporal.PlainDate>;
  readonly firstDayOfWeek: MaybeRefOrGetter<DayOfWeek>;
  readonly weekendDays: MaybeRefOrGetter<readonly DayOfWeek[]>;
};

export type UseWeekGridOptions = {
  /** Day columns: 7 snaps to the week, 1/3/N roll from the focused date. */
  readonly days?: MaybeRefOrGetter<number | undefined>;
  readonly startHour?: MaybeRefOrGetter<number | undefined>;
  readonly endHour?: MaybeRefOrGetter<number | undefined>;
};

export type HourLabel = {
  readonly hour: number;
  /** Localized label honoring the locale's hour cycle (e.g. "1 PM" / "13時"). */
  readonly label: string;
};

export type UseWeekGridReturn = {
  readonly grid: ComputedRef<WeekGrid>;
  readonly hourLabels: ComputedRef<readonly HourLabel[]>;
};

// --- Implementation ---

/** Reactive time-grid week around the focused date, plus localized hour labels. */
export function useWeekGrid(
  source: WeekGridSource,
  options: UseWeekGridOptions = {},
): UseWeekGridReturn {
  const grid = computed(() =>
    buildWeekGrid({
      anchor: toValue(source.focusedDate),
      today: toValue(source.today),
      firstDayOfWeek: toValue(source.firstDayOfWeek),
      weekendDays: toValue(source.weekendDays),
      days: toValue(options.days),
      startHour: toValue(options.startHour),
      endHour: toValue(options.endHour),
    }),
  );

  const hourLabels = computed<readonly HourLabel[]>(() => {
    const locale = toValue(source.locale);
    return grid.value.hours.map((hour) => ({
      hour,
      label: formatHour(locale, hour),
    }));
  });

  return { grid, hourLabels };
}
