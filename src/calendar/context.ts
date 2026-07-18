import type { InjectionKey } from "vue";
import { inject, provide } from "vue";
import type { CalendarEventLike } from "../events/event";
import type { UseCalendarEventsReturn } from "../events/useCalendarEvents";
import type { DateSelectionMode } from "./selection";
import type { UseCalendarReturn } from "./useCalendar";

// --- Types & Signatures ---

export type CalendarContext = {
  readonly calendar: UseCalendarReturn<DateSelectionMode>;
  readonly events: UseCalendarEventsReturn<CalendarEventLike>;
  readonly ids: {
    /** Links the visible title to the grids via `aria-labelledby`. */
    readonly title: string;
  };
};

// --- Implementation ---

export const CalendarContextKey: InjectionKey<CalendarContext> = Symbol("CalendarContext");

export function provideCalendarContext(context: CalendarContext): void {
  provide(CalendarContextKey, context);
}

export function useCalendarContext(): CalendarContext {
  const context = inject(CalendarContextKey);
  if (context === undefined) {
    throw new Error(
      "[vue-calendar-temporal] Calendar components must be placed inside <CalendarRoot>.",
    );
  }
  return context;
}
