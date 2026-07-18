import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import type {
  DateSelectionMode,
  DateSelectionValue,
} from "../calendar/selection";
import type {
  UseCalendarOptions,
  UseCalendarReturn,
} from "../calendar/useCalendar";
import { useCalendar } from "../calendar/useCalendar";
import {
  formatPlainDate,
  formatPlainDateList,
  formatPlainDateRange,
} from "../i18n/locale";
import { useControllableState } from "../shared/controllable";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

export type UseDatePickerOptions<Mode extends DateSelectionMode = "single"> =
  UseCalendarOptions<Mode> & {
    /** Controlled open state. Omit for internal state. */
    readonly open?: MaybeRefOrGetter<boolean | undefined>;
    readonly onUpdateOpen?: (open: boolean) => void;
    readonly initialOpen?: boolean;
    /**
     * Close the popup once a selection is complete (a date in single mode, a
     * finished range in range mode; multiple mode never auto-closes).
     * Default: true.
     */
    readonly closeOnSelect?: boolean;
    /** `Intl` options for the formatted trigger value. */
    readonly displayFormat?: Intl.DateTimeFormatOptions;
  };

export type UseDatePickerReturn<Mode extends DateSelectionMode = "single"> = {
  readonly calendar: UseCalendarReturn<Mode>;
  readonly open: ComputedRef<boolean>;
  /** Localized text of the current selection; empty when nothing is selected. */
  readonly formattedValue: ComputedRef<string>;
  readonly setOpen: (open: boolean) => void;
  readonly toggle: () => void;
  readonly close: () => void;
};

// --- Implementation ---

/**
 * Date picker state: a full calendar plus popup open/close plumbing and a
 * localized display value. Selection completion closes the popup by default.
 */
export function useDatePicker<Mode extends DateSelectionMode = "single">(
  options: UseDatePickerOptions<Mode> = {},
): UseDatePickerReturn<Mode> {
  const openState = useControllableState<boolean>(
    () => toValue(options.open),
    options.initialOpen ?? false,
    options.onUpdateOpen,
  );

  // `Array.isArray` alone does not narrow readonly arrays out of a union.
  const isDateList = (
    value: DateSelectionValue,
  ): value is readonly Temporal.PlainDate[] => Array.isArray(value);

  function maybeCloseAfter(value: DateSelectionValue<Mode>): void {
    if (!(options.closeOnSelect ?? true)) return;
    // Complete = a single date or a finished range; multiple mode stays open.
    if (value !== null && !isDateList(value)) openState.setState(false);
  }

  const calendar = useCalendar<Mode>({
    ...options,
    onUpdateSelected: (value) => {
      options.onUpdateSelected?.(value);
      maybeCloseAfter(value);
    },
  });

  const formattedValue = computed(() => {
    const locale = calendar.locale.value;
    const value: DateSelectionValue = calendar.selected.value;
    const format = options.displayFormat ?? { dateStyle: "medium" };
    if (value === null) return "";
    if (isDateList(value)) {
      return value.length === 0
        ? ""
        : formatPlainDateList(locale, value, format);
    }
    if ("start" in value)
      return formatPlainDateRange(locale, value.start, value.end, format);
    return formatPlainDate(locale, value, format);
  });

  function setOpen(open: boolean): void {
    openState.setState(open);
  }

  function toggle(): void {
    openState.setState(!openState.state.value);
  }

  function close(): void {
    openState.setState(false);
  }

  return {
    calendar,
    open: openState.state,
    formattedValue,
    setOpen,
    toggle,
    close,
  };
}
