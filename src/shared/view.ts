// --- Types & Signatures ---

/** The rendering granularity of the calendar. */
export type CalendarView = "month" | "week" | "year";

export type CALENDAR_VIEWS = readonly CalendarView[];

// --- Implementation ---

export const CALENDAR_VIEWS: CALENDAR_VIEWS = ["month", "week", "year"];
