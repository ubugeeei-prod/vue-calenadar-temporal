import type { InjectionKey, ShallowRef } from "vue";
import { inject, provide } from "vue";
import type { DateSelectionMode } from "../calendar/selection";
import type { UseDatePickerReturn } from "./useDatePicker";

// --- Types & Signatures ---

export type DatePickerContext = {
  readonly picker: UseDatePickerReturn<DateSelectionMode>;
  readonly ids: {
    readonly trigger: string;
    readonly dialog: string;
  };
  /** The trigger element, so outside-click detection can ignore it. */
  readonly triggerElement: ShallowRef<HTMLElement | null>;
};

// --- Implementation ---

export const DatePickerContextKey: InjectionKey<DatePickerContext> =
  Symbol("DatePickerContext");

export function provideDatePickerContext(context: DatePickerContext): void {
  provide(DatePickerContextKey, context);
}

export function useDatePickerContext(): DatePickerContext {
  const context = inject(DatePickerContextKey);
  if (context === undefined) {
    throw new Error(
      "[vue-calendar-temporal] DatePicker components must be placed inside <DatePickerRoot>.",
    );
  }
  return context;
}
