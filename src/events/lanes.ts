import type { DateRange } from "../shared/date";
import { Temporal } from "../temporal";
import type { CalendarEventLike, NormalizedEvent } from "./event";

// --- Types & Signatures ---

/**
 * A horizontal bar for one event within one week row (Google-style spanning
 * chips). Used both by the month view rows and by the week view's all-day
 * strip.
 */
export type EventLaneSegment<TEvent extends CalendarEventLike = CalendarEventLike> = {
  readonly event: NormalizedEvent<TEvent>;
  /** 0-based day column where the bar starts within the row. */
  readonly startColumn: number;
  /** Number of day columns covered (≥ 1). */
  readonly span: number;
  /** 0-based stacking lane. */
  readonly lane: number;
  /** The event started before this row (render without a start cap). */
  readonly continuesBefore: boolean;
  /** The event continues past this row (render without an end cap). */
  readonly continuesAfter: boolean;
};

export type EventLaneLayout<TEvent extends CalendarEventLike = CalendarEventLike> = {
  readonly segments: readonly EventLaneSegment<TEvent>[];
  /** Number of lanes used by visible segments. */
  readonly laneCount: number;
  /**
   * Events hidden by `maxLanes`, per day column — feed the "+N more"
   * indicator.
   */
  readonly overflow: readonly number[];
  /** Events hidden anywhere in the row (deduplicated). */
  readonly hiddenEvents: readonly NormalizedEvent<TEvent>[];
};

export type EventLaneOptions = {
  /** Hide segments that would land on a lane ≥ `maxLanes`. Default: unlimited. */
  readonly maxLanes?: number;
};

export type layoutEventLanes = <TEvent extends CalendarEventLike>(
  events: readonly NormalizedEvent<TEvent>[],
  week: DateRange,
  options?: EventLaneOptions,
) => EventLaneLayout<TEvent>;

/** Events rendered as spanning bars (vs. inside the time grid). */
export type isLaneEvent = (event: NormalizedEvent) => boolean;

// --- Implementation ---

export const isLaneEvent: isLaneEvent = (event) => event.allDay || event.spanDays > 1;

type Clipped<TEvent extends CalendarEventLike> = {
  readonly event: NormalizedEvent<TEvent>;
  readonly startColumn: number;
  readonly span: number;
  readonly continuesBefore: boolean;
  readonly continuesAfter: boolean;
};

const clipToWeek = <TEvent extends CalendarEventLike>(
  event: NormalizedEvent<TEvent>,
  week: DateRange,
  weekLength: number,
): Clipped<TEvent> | undefined => {
  if (
    Temporal.PlainDate.compare(event.endDate, week.start) < 0 ||
    Temporal.PlainDate.compare(event.startDate, week.end) > 0
  ) {
    return undefined;
  }
  const continuesBefore = Temporal.PlainDate.compare(event.startDate, week.start) < 0;
  const continuesAfter = Temporal.PlainDate.compare(event.endDate, week.end) > 0;
  const startColumn = continuesBefore ? 0 : week.start.until(event.startDate).days;
  const endColumn = continuesAfter ? weekLength - 1 : week.start.until(event.endDate).days;
  return {
    event,
    startColumn,
    span: endColumn - startColumn + 1,
    continuesBefore,
    continuesAfter,
  };
};

const compareClipped = (a: Clipped<CalendarEventLike>, b: Clipped<CalendarEventLike>): number => {
  if (a.startColumn !== b.startColumn) return a.startColumn - b.startColumn;
  if (a.span !== b.span) return b.span - a.span;
  if (a.event.allDay !== b.event.allDay) return a.event.allDay ? -1 : 1;
  const byStart = Temporal.PlainDateTime.compare(a.event.start, b.event.start);
  if (byStart !== 0) return byStart;
  return String(a.event.id) < String(b.event.id) ? -1 : 1;
};

export const layoutEventLanes: layoutEventLanes = <TEvent extends CalendarEventLike>(
  events: readonly NormalizedEvent<TEvent>[],
  week: DateRange,
  options?: EventLaneOptions,
) => {
  const weekLength = week.start.until(week.end).days + 1;
  const maxLanes = options?.maxLanes ?? Number.POSITIVE_INFINITY;

  const clipped = events
    .map((event) => clipToWeek(event, week, weekLength))
    .filter((segment): segment is Clipped<TEvent> => segment !== undefined)
    .sort(compareClipped);

  // laneEnds[lane] = first free column on that lane.
  const laneEnds: number[] = [];
  const segments: EventLaneSegment<TEvent>[] = [];
  const overflow: number[] = Array.from({ length: weekLength }, () => 0);
  const hiddenEvents: NormalizedEvent<TEvent>[] = [];

  for (const segment of clipped) {
    let lane = laneEnds.findIndex((firstFree) => firstFree <= segment.startColumn);
    if (lane === -1) lane = laneEnds.length;
    if (lane >= maxLanes) {
      hiddenEvents.push(segment.event);
      for (
        let column = segment.startColumn;
        column < segment.startColumn + segment.span;
        column += 1
      ) {
        overflow[column] = (overflow[column] ?? 0) + 1;
      }
      continue;
    }
    laneEnds[lane] = segment.startColumn + segment.span;
    segments.push({ ...segment, lane });
  }

  return { segments, laneCount: laneEnds.length, overflow, hiddenEvents };
};
