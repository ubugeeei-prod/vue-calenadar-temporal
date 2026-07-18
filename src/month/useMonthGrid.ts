import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import type { NameStyle } from "../i18n/locale";
import { weekdayNames } from "../i18n/locale";
import type { DayOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";
import type { MonthGrid } from "./month-grid";
import { buildMonthGrid } from "./month-grid";

// --- Types & Signatures ---

/**
 * The state slice a month grid needs. `UseCalendarReturn` satisfies it
 * structurally, but plain refs work just as well for standalone use.
 */
export type MonthGridSource = {
  readonly locale: MaybeRefOrGetter<string>;
  readonly focusedDate: MaybeRefOrGetter<Temporal.PlainDate>;
  readonly today: MaybeRefOrGetter<Temporal.PlainDate>;
  readonly firstDayOfWeek: MaybeRefOrGetter<DayOfWeek>;
  readonly weekendDays: MaybeRefOrGetter<readonly DayOfWeek[]>;
};

export type UseMonthGridOptions = {
  /** Always render six weeks for a stable height. Default: false. */
  readonly fixedWeekCount?: MaybeRefOrGetter<boolean | undefined>;
  /** Column header label style. Default: "short". */
  readonly weekdayStyle?: MaybeRefOrGetter<NameStyle | undefined>;
};

export type WeekdayLabel = {
  readonly dayOfWeek: DayOfWeek;
  /** Column header text in the configured style. */
  readonly label: string;
  /** Long name for `abbr` / aria labels. */
  readonly fullName: string;
};

export type UseMonthGridReturn = {
  readonly grid: ComputedRef<MonthGrid>;
  readonly weekdays: ComputedRef<readonly WeekdayLabel[]>;
};

// --- Implementation ---

/** Reactive month grid for the focused month, plus localized weekday headers. */
export function useMonthGrid(
  source: MonthGridSource,
  options: UseMonthGridOptions = {},
): UseMonthGridReturn {
  const grid = computed(() =>
    buildMonthGrid({
      month: toValue(source.focusedDate).toPlainYearMonth(),
      today: toValue(source.today),
      firstDayOfWeek: toValue(source.firstDayOfWeek),
      weekendDays: toValue(source.weekendDays),
      fixedWeekCount: toValue(options.fixedWeekCount) ?? false,
    }),
  );

  const weekdays = computed<readonly WeekdayLabel[]>(() => {
    const locale = toValue(source.locale);
    const firstDayOfWeek = toValue(source.firstDayOfWeek);
    const labels = weekdayNames(
      locale,
      toValue(options.weekdayStyle) ?? "short",
      firstDayOfWeek,
    );
    const fullNames = weekdayNames(locale, "long", firstDayOfWeek);
    return labels.map((label, index) => ({
      dayOfWeek: (((firstDayOfWeek - 1 + index) % 7) + 1) as DayOfWeek,
      label,
      fullName: fullNames[index] ?? label,
    }));
  });

  return { grid, weekdays };
}
