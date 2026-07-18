import type { CalendarView } from "../shared/view";

// --- Types & Signatures ---

/**
 * Every user-facing string the components render or announce.
 *
 * Defaults are English; pass a partial override (e.g. wired to vue-i18n) to
 * localize. Functions receive raw values so plural and ordering rules stay
 * fully in the caller's control.
 */
export type CalendarMessages = {
  readonly today: string;
  readonly previous: (view: CalendarView) => string;
  readonly next: (view: CalendarView) => string;
  readonly weekNumberColumn: string;
  readonly weekNumber: (week: number) => string;
  readonly moreEvents: (count: number) => string;
  /** Screen-reader suffix announcing how many events a day holds. */
  readonly events: (count: number) => string;
  readonly allDay: string;
  readonly chooseDate: string;
  readonly close: string;
};

export type mergeMessages = (overrides?: Partial<CalendarMessages>) => CalendarMessages;

// --- Implementation ---

const VIEW_NOUNS: Record<CalendarView, string> = {
  month: "month",
  week: "week",
  year: "year",
};

export const englishMessages: CalendarMessages = {
  today: "Today",
  previous: (view) => `Previous ${VIEW_NOUNS[view]}`,
  next: (view) => `Next ${VIEW_NOUNS[view]}`,
  weekNumberColumn: "Wk",
  weekNumber: (week) => `Week ${week}`,
  moreEvents: (count) => `+${count} more`,
  events: (count) => (count === 1 ? "1 event" : `${count} events`),
  allDay: "All day",
  chooseDate: "Choose date",
  close: "Close",
};

export const mergeMessages: mergeMessages = (overrides) =>
  overrides === undefined ? englishMessages : { ...englishMessages, ...overrides };
