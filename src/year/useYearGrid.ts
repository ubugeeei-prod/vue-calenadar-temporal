import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { formatYearMonth } from "../i18n/locale";
import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";
import type { YearGrid, YearGridMonth } from "./year-grid";
import { buildYearGrid } from "./year-grid";

// --- Types & Signatures ---

/** The state slice a year grid needs; `UseCalendarReturn` satisfies it. */
export type YearGridSource = {
  readonly locale: MaybeRefOrGetter<string>;
  readonly focusedDate: MaybeRefOrGetter<Temporal.PlainDate>;
  readonly today: MaybeRefOrGetter<Temporal.PlainDate>;
  readonly firstDayOfWeek: MaybeRefOrGetter<DayOfWeek>;
  readonly weekendDays: MaybeRefOrGetter<readonly DayOfWeek[]>;
};

export type LabeledYearGridMonth = YearGridMonth & {
  /** Localized month name (e.g. "July" / "7月"). */
  readonly label: string;
};

export type UseYearGridReturn = {
  readonly grid: ComputedRef<YearGrid>;
  readonly months: ComputedRef<readonly LabeledYearGridMonth[]>;
};

// --- Implementation ---

/** Reactive year overview for the focused year with localized month labels. */
export function useYearGrid(source: YearGridSource): UseYearGridReturn {
  const grid = computed(() =>
    buildYearGrid({
      anchor: toValue(source.focusedDate),
      today: toValue(source.today),
      firstDayOfWeek: toValue(source.firstDayOfWeek),
      weekendDays: toValue(source.weekendDays),
    }),
  );

  const months = computed<readonly LabeledYearGridMonth[]>(() => {
    const locale = toValue(source.locale);
    return grid.value.months.map((month) => ({
      ...month,
      label: formatYearMonth(locale, month.month, { month: "long" }),
    }));
  });

  return { grid, months };
}
