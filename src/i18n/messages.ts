/**
 * The message catalog: every user-facing string the components render or
 * announce to assistive technology.
 *
 * The components never hardcode prose — they read it from a
 * {@link CalendarMessages} value, whose defaults are English. Localize by
 * merging a partial override (hand-written, or wired to vue-i18n or any
 * other i18n system); entries that vary with a count or a view are
 * functions, so plural rules and word order stay fully in your hands.
 *
 * @example
 * ```ts
 * const messages = mergeMessages({
 *   today: "今日",
 *   moreEvents: (count) => `他${count}件`,
 *   previous: (view) => (view === "month" ? "前の月" : "前へ"),
 * });
 * ```
 */
import type { CalendarView } from "../shared/view";

// --- Types & Signatures ---

/**
 * Every string the calendar UI needs.
 *
 * | Key | Where it appears |
 * | --- | --- |
 * | `today` | Today button label |
 * | `previous` / `next` | Nav button `aria-label`s, per view |
 * | `weekNumberColumn` | Week-number column header |
 * | `weekNumber` | Week-number row header `aria-label` |
 * | `moreEvents` | "+N more" overflow indicator |
 * | `events` | Screen-reader event-count suffix on day cells |
 * | `allDay` | All-day strip gutter label and event `aria-label`s |
 * | `chooseDate` | Date-picker trigger placeholder and dialog label |
 * | `close` | Close affordances |
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

export type mergeMessages = (
  overrides?: Partial<CalendarMessages>,
) => CalendarMessages;

// --- Implementation ---

const VIEW_NOUNS: Record<CalendarView, string> = {
  month: "month",
  week: "week",
  year: "year",
};

/**
 * The built-in English catalog.
 *
 * Exposed so overrides can delegate to it — e.g. wrap `previous` for one
 * view and fall back for the rest.
 */
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

/**
 * Merges partial overrides over {@link englishMessages}.
 *
 * With no argument the English catalog comes back as-is — the same
 * instance, so referential equality holds for memoization.
 *
 * @default englishMessages
 */
export const mergeMessages: mergeMessages = (overrides) =>
  overrides === undefined
    ? englishMessages
    : { ...englishMessages, ...overrides };
