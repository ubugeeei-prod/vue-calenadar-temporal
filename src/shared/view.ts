/**
 * The calendar's view vocabulary.
 *
 * Kept in `shared/` because both the state layer (navigation granularity)
 * and the i18n layer (button labels like "Next month") speak in views.
 */

// --- Types & Signatures ---

/**
 * The rendering granularity of the calendar.
 *
 * - `"month"` — the classic month grid.
 * - `"week"` — the time grid (also covers day / 3-day via a `days` option).
 * - `"year"` — twelve mini months.
 *
 * Navigation steps match the view: `next()` advances one month, one week,
 * or one year respectively.
 */
export type CalendarView = "month" | "week" | "year";

export type CALENDAR_VIEWS = readonly CalendarView[];

// --- Implementation ---

/**
 * Every {@link CalendarView}, in display order — handy for rendering a view
 * switcher.
 *
 * @example
 * ```html
 * <button v-for="view in CALENDAR_VIEWS" @click="() => calendar.setView(view)">
 *   {{ view }}
 * </button>
 * ```
 */
export const CALENDAR_VIEWS: CALENDAR_VIEWS = ["month", "week", "year"];
