import type { DateRange } from "../shared/date";
import { isBetween, isSameDay, orderedRange } from "../shared/date";
import { Temporal } from "../temporal";

// --- Types & Signatures ---

export type DateSelectionMode = "single" | "multiple" | "range";

export type SingleDateValue = Temporal.PlainDate | null;
export type MultipleDateValue = readonly Temporal.PlainDate[];
export type RangeDateValue = DateRange | null;

/** The v-model value shape for each selection mode. */
export type DateSelectionValue<Mode extends DateSelectionMode = DateSelectionMode> =
  Mode extends "single"
    ? SingleDateValue
    : Mode extends "multiple"
      ? MultipleDateValue
      : RangeDateValue;

export type RangePickResult = {
  readonly pending: Temporal.PlainDate | null;
  readonly value: RangeDateValue;
};

export type selectSingle = (date: Temporal.PlainDate) => SingleDateValue;
export type toggleMultiple = (
  current: MultipleDateValue,
  date: Temporal.PlainDate,
) => MultipleDateValue;
export type pickRange = (
  pending: Temporal.PlainDate | null,
  date: Temporal.PlainDate,
) => RangePickResult;
export type rangePreview = (
  pending: Temporal.PlainDate | null,
  hovered: Temporal.PlainDate | null,
) => RangeDateValue;
export type selectionContains = (value: DateSelectionValue, date: Temporal.PlainDate) => boolean;
export type rangeEdge = (
  value: RangeDateValue,
  date: Temporal.PlainDate,
) => "start" | "end" | "both" | null;

// --- Implementation ---

export const selectSingle: selectSingle = (date) => date;

export const toggleMultiple: toggleMultiple = (current, date) => {
  const without = current.filter((candidate) => !isSameDay(candidate, date));
  if (without.length !== current.length) return without;
  return [...current, date].sort(Temporal.PlainDate.compare);
};

/**
 * Two-click range building: the first pick clears the value and remembers the
 * pending start, the second emits the ordered range.
 */
export const pickRange: pickRange = (pending, date) =>
  pending === null
    ? { pending: date, value: null }
    : { pending: null, value: orderedRange(pending, date) };

export const rangePreview: rangePreview = (pending, hovered) =>
  pending !== null && hovered !== null ? orderedRange(pending, hovered) : null;

// `Array.isArray` alone does not narrow readonly arrays out of a union.
const isDateList = (value: DateSelectionValue): value is MultipleDateValue => Array.isArray(value);

export const selectionContains: selectionContains = (value, date) => {
  if (value === null) return false;
  if (isDateList(value)) return value.some((candidate) => isSameDay(candidate, date));
  if ("start" in value) return isBetween(date, value);
  return isSameDay(value, date);
};

export const rangeEdge: rangeEdge = (value, date) => {
  if (value === null) return null;
  const atStart = isSameDay(value.start, date);
  const atEnd = isSameDay(value.end, date);
  if (atStart && atEnd) return "both";
  if (atStart) return "start";
  if (atEnd) return "end";
  return null;
};
