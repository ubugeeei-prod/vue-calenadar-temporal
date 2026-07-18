import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, shallowRef, toValue } from "vue";
import type { TextDirection } from "../i18n/locale";
import {
  formatPlainDate,
  formatPlainDateRange,
  formatYearMonth,
  localeFirstDayOfWeek,
  localeTextDirection,
  localeWeekendDays,
  resolveLocale,
} from "../i18n/locale";
import type { CalendarMessages } from "../i18n/messages";
import { mergeMessages } from "../i18n/messages";
import type { DateRange, DayOfWeek } from "../shared/date";
import { clampDate, currentDate, isBetween, systemTimeZone } from "../shared/date";
import { useControllableState } from "../shared/controllable";
import type { CalendarView } from "../shared/view";
import type { Temporal } from "../temporal";
import { canShiftPeriod, periodRange, shiftPeriod } from "./calendar";
import type { DateSelectionMode, DateSelectionValue, RangeDateValue } from "./selection";
import { pickRange, rangeEdge, rangePreview, selectionContains, toggleMultiple } from "./selection";

// --- Types & Signatures ---

export type UseCalendarOptions<Mode extends DateSelectionMode = "single"> = {
  /** BCP-47 tag or `Intl.Locale`. Defaults to the runtime locale. */
  readonly locale?: MaybeRefOrGetter<string | Intl.Locale | undefined>;
  /** IANA time zone used to resolve "today" and absolute event times. */
  readonly timeZone?: MaybeRefOrGetter<string | undefined>;
  /** Defaults to the locale's first day of week. */
  readonly firstDayOfWeek?: MaybeRefOrGetter<DayOfWeek | undefined>;
  /** Defaults to the locale's weekend days. */
  readonly weekendDays?: MaybeRefOrGetter<readonly DayOfWeek[] | undefined>;
  /** Defaults to the locale's script direction. */
  readonly direction?: MaybeRefOrGetter<TextDirection | undefined>;
  /** Partial overrides merged over the English defaults. */
  readonly messages?: MaybeRefOrGetter<Partial<CalendarMessages> | undefined>;
  /**
   * Reference "today". Defaults to the current date in `timeZone`, evaluated
   * once at setup — pass an explicit value for deterministic SSR output.
   */
  readonly today?: MaybeRefOrGetter<Temporal.PlainDate | undefined>;
  /** Static selection mode; decides the `selected` value shape. Default: "single". */
  readonly selectionMode?: Mode;
  /** Controlled selection value (v-model). Omit for internal state. */
  readonly selected?: MaybeRefOrGetter<DateSelectionValue<Mode> | undefined>;
  readonly onUpdateSelected?: (value: DateSelectionValue<Mode>) => void;
  /** Controlled view. Omit for internal state. */
  readonly view?: MaybeRefOrGetter<CalendarView | undefined>;
  readonly onUpdateView?: (view: CalendarView) => void;
  readonly initialView?: CalendarView;
  readonly initialFocusedDate?: Temporal.PlainDate;
  readonly minDate?: MaybeRefOrGetter<Temporal.PlainDate | undefined>;
  readonly maxDate?: MaybeRefOrGetter<Temporal.PlainDate | undefined>;
  /** Extra per-date disabling on top of `minDate` / `maxDate`. */
  readonly isDateDisabled?: (date: Temporal.PlainDate) => boolean;
};

export type UseCalendarReturn<Mode extends DateSelectionMode = "single"> = {
  // --- resolved configuration ---
  readonly locale: ComputedRef<string>;
  readonly timeZone: ComputedRef<string>;
  readonly firstDayOfWeek: ComputedRef<DayOfWeek>;
  readonly weekendDays: ComputedRef<readonly DayOfWeek[]>;
  readonly direction: ComputedRef<TextDirection>;
  readonly messages: ComputedRef<CalendarMessages>;
  readonly selectionMode: Mode;
  // --- state ---
  readonly today: ComputedRef<Temporal.PlainDate>;
  readonly view: ComputedRef<CalendarView>;
  readonly focusedDate: ComputedRef<Temporal.PlainDate>;
  readonly selected: ComputedRef<DateSelectionValue<Mode>>;
  readonly pendingRangeStart: ComputedRef<Temporal.PlainDate | null>;
  readonly hoveredDate: ComputedRef<Temporal.PlainDate | null>;
  readonly previewRange: ComputedRef<RangeDateValue>;
  // --- derived ---
  readonly title: ComputedRef<string>;
  readonly visibleRange: ComputedRef<DateRange>;
  readonly canGoPrevious: ComputedRef<boolean>;
  readonly canGoNext: ComputedRef<boolean>;
  // --- guards ---
  readonly isDateDisabled: (date: Temporal.PlainDate) => boolean;
  readonly isSelected: (date: Temporal.PlainDate) => boolean;
  readonly rangeEdgeOf: (date: Temporal.PlainDate) => "start" | "end" | "both" | null;
  // --- actions ---
  readonly setView: (view: CalendarView) => void;
  readonly focusDate: (date: Temporal.PlainDate) => void;
  readonly select: (date: Temporal.PlainDate) => void;
  readonly hoverDate: (date: Temporal.PlainDate | null) => void;
  readonly next: () => void;
  readonly previous: () => void;
  readonly goToToday: () => void;
};

// --- Implementation ---

const EMPTY_SELECTION: Record<DateSelectionMode, DateSelectionValue> = {
  single: null,
  multiple: [],
  range: null,
};

/**
 * Core calendar state: resolved locale configuration, the current view,
 * focus, navigation, and date selection. View-specific grids build on top of
 * this (see `useMonthGrid` and friends).
 */
export function useCalendar<Mode extends DateSelectionMode = "single">(
  options: UseCalendarOptions<Mode> = {},
): UseCalendarReturn<Mode> {
  const selectionMode: Mode = options.selectionMode ?? ("single" as Mode);

  // --- configuration ---
  const locale = computed(() => resolveLocale(toValue(options.locale)));
  const timeZone = computed(() => toValue(options.timeZone) ?? systemTimeZone());
  const firstDayOfWeek = computed(
    () => toValue(options.firstDayOfWeek) ?? localeFirstDayOfWeek(locale.value),
  );
  const weekendDays = computed(
    () => toValue(options.weekendDays) ?? localeWeekendDays(locale.value),
  );
  const direction = computed(() => toValue(options.direction) ?? localeTextDirection(locale.value));
  const messages = computed(() => mergeMessages(toValue(options.messages)));
  const minDate = computed(() => toValue(options.minDate));
  const maxDate = computed(() => toValue(options.maxDate));

  const setupDate = currentDate(toValue(options.timeZone));
  const today = computed(() => toValue(options.today) ?? setupDate);

  // --- state ---
  const viewState = useControllableState<CalendarView>(
    () => toValue(options.view),
    options.initialView ?? "month",
    options.onUpdateView,
  );
  const selectedState = useControllableState<DateSelectionValue<Mode>>(
    () => toValue(options.selected),
    EMPTY_SELECTION[selectionMode] as DateSelectionValue<Mode>,
    options.onUpdateSelected,
  );

  const focused = shallowRef(
    clampDate(options.initialFocusedDate ?? setupDate, minDate.value, maxDate.value),
  );
  const pendingRangeStart = shallowRef<Temporal.PlainDate | null>(null);
  const hovered = shallowRef<Temporal.PlainDate | null>(null);

  // --- derived ---
  const visibleRange = computed(() =>
    periodRange(viewState.state.value, focused.value, firstDayOfWeek.value),
  );

  const title = computed(() => {
    const view = viewState.state.value;
    if (view === "month") return formatYearMonth(locale.value, focused.value.toPlainYearMonth());
    if (view === "year") return formatPlainDate(locale.value, focused.value, { year: "numeric" });
    const range = visibleRange.value;
    return formatPlainDateRange(locale.value, range.start, range.end, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });

  const canGoPrevious = computed(() =>
    canShiftPeriod(
      viewState.state.value,
      focused.value,
      -1,
      firstDayOfWeek.value,
      minDate.value,
      maxDate.value,
    ),
  );
  const canGoNext = computed(() =>
    canShiftPeriod(
      viewState.state.value,
      focused.value,
      1,
      firstDayOfWeek.value,
      minDate.value,
      maxDate.value,
    ),
  );

  const previewRange = computed(() => rangePreview(pendingRangeStart.value, hovered.value));

  // --- guards ---
  function isDateDisabled(date: Temporal.PlainDate): boolean {
    const min = minDate.value;
    const max = maxDate.value;
    if (min !== undefined || max !== undefined) {
      const lower = min ?? date;
      const upper = max ?? date;
      if (!isBetween(date, { start: lower, end: upper })) return true;
    }
    return options.isDateDisabled?.(date) ?? false;
  }

  function isSelected(date: Temporal.PlainDate): boolean {
    return selectionContains(selectedState.state.value, date);
  }

  function rangeEdgeOf(date: Temporal.PlainDate): "start" | "end" | "both" | null {
    return selectionMode === "range"
      ? rangeEdge(selectedState.state.value as RangeDateValue, date)
      : null;
  }

  // --- actions ---
  function setView(view: CalendarView): void {
    viewState.setState(view);
  }

  function focusDate(date: Temporal.PlainDate): void {
    focused.value = clampDate(date, minDate.value, maxDate.value);
  }

  function select(date: Temporal.PlainDate): void {
    if (isDateDisabled(date)) return;
    focusDate(date);
    if (selectionMode === "multiple") {
      const current = selectedState.state.value as readonly Temporal.PlainDate[];
      selectedState.setState(toggleMultiple(current, date) as DateSelectionValue<Mode>);
      return;
    }
    if (selectionMode === "range") {
      const picked = pickRange(pendingRangeStart.value, date);
      pendingRangeStart.value = picked.pending;
      selectedState.setState(picked.value as DateSelectionValue<Mode>);
      return;
    }
    selectedState.setState(date as DateSelectionValue<Mode>);
  }

  function hoverDate(date: Temporal.PlainDate | null): void {
    hovered.value = date;
  }

  function navigate(delta: number): void {
    focused.value = clampDate(
      shiftPeriod(viewState.state.value, focused.value, delta),
      minDate.value,
      maxDate.value,
    );
  }

  function next(): void {
    if (canGoNext.value) navigate(1);
  }

  function previous(): void {
    if (canGoPrevious.value) navigate(-1);
  }

  function goToToday(): void {
    focusDate(today.value);
  }

  return {
    locale,
    timeZone,
    firstDayOfWeek,
    weekendDays,
    direction,
    messages,
    selectionMode,
    today,
    view: viewState.state,
    focusedDate: computed(() => focused.value),
    selected: selectedState.state,
    pendingRangeStart: computed(() => pendingRangeStart.value),
    hoveredDate: computed(() => hovered.value),
    previewRange,
    title,
    visibleRange,
    canGoPrevious,
    canGoNext,
    isDateDisabled,
    isSelected,
    rangeEdgeOf,
    setView,
    focusDate,
    select,
    hoverDate,
    next,
    previous,
    goToToday,
  };
}
