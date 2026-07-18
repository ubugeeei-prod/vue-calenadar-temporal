import { Temporal } from "../temporal";
import type { CalendarEventLike, NormalizedEvent } from "./event";

// --- Types & Signatures ---

/**
 * Geometry of one timed event inside a day column, in fractions of the
 * rendered hour axis — multiply by the column height/width (or map to grid
 * rows) to draw it.
 */
export type TimeGridPlacement<
  TEvent extends CalendarEventLike = CalendarEventLike,
> = {
  readonly event: NormalizedEvent<TEvent>;
  /** Offset from the axis start, `0 ≤ top < 1`. */
  readonly top: number;
  /** Vertical size, `0 < height ≤ 1`. */
  readonly height: number;
  /** 0-based column inside the overlap cluster. */
  readonly column: number;
  /** Total columns in the overlap cluster. */
  readonly columnCount: number;
  /** Horizontal offset fraction (`column / columnCount`). */
  readonly left: number;
  /** Horizontal size fraction (`1 / columnCount`). */
  readonly width: number;
  /** Continues before the axis start (earlier day or earlier hour). */
  readonly clipTop: boolean;
  /** Continues past the axis end. */
  readonly clipBottom: boolean;
};

export type TimeGridOptions = {
  /** First rendered hour (inclusive). Default: 0. */
  readonly startHour?: number;
  /** Last rendered hour (exclusive). Default: 24. */
  readonly endHour?: number;
  /**
   * Minimum rendered duration in minutes so tiny events stay clickable.
   * Default: 15.
   */
  readonly minEventMinutes?: number;
};

export type layoutTimeGridDay = <TEvent extends CalendarEventLike>(
  events: readonly NormalizedEvent<TEvent>[],
  day: Temporal.PlainDate,
  options?: TimeGridOptions,
) => readonly TimeGridPlacement<TEvent>[];

// --- Implementation ---

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_MIN_EVENT_MINUTES = 15;

/**
 * Signed minute offset of `dateTime` from `day`'s midnight — negative before
 * the day, beyond 1440 after it — so axis clipping can tell true spill-over
 * from an exact midnight end.
 */
const minuteOffset = (
  dateTime: Temporal.PlainDateTime,
  day: Temporal.PlainDate,
): number => {
  const dayDifference = day.until(dateTime.toPlainDate()).days;
  return (
    dayDifference * MINUTES_PER_DAY +
    dateTime.hour * 60 +
    dateTime.minute +
    dateTime.second / 60
  );
};

type Interval<TEvent extends CalendarEventLike> = {
  readonly event: NormalizedEvent<TEvent>;
  readonly startMinute: number;
  readonly endMinute: number;
  readonly clipTop: boolean;
  readonly clipBottom: boolean;
};

export const layoutTimeGridDay: layoutTimeGridDay = <
  TEvent extends CalendarEventLike,
>(
  events: readonly NormalizedEvent<TEvent>[],
  day: Temporal.PlainDate,
  options?: TimeGridOptions,
) => {
  const axisStart = (options?.startHour ?? 0) * 60;
  const axisEnd = (options?.endHour ?? 24) * 60;
  const axisLength = axisEnd - axisStart;
  const minEventMinutes = options?.minEventMinutes ?? DEFAULT_MIN_EVENT_MINUTES;
  if (axisLength <= 0) return [];

  const intervals: Interval<TEvent>[] = [];
  for (const event of events) {
    if (event.allDay) continue;
    const rawStart = minuteOffset(event.start, day);
    const rawEnd = minuteOffset(event.end, day);
    if (rawEnd <= axisStart || rawStart >= axisEnd) continue;
    const startMinute = Math.max(rawStart, axisStart);
    const endMinute = Math.min(
      Math.max(rawEnd, startMinute + minEventMinutes),
      axisEnd,
    );
    intervals.push({
      event,
      startMinute,
      endMinute,
      clipTop: rawStart < axisStart,
      clipBottom: rawEnd > axisEnd,
    });
  }

  intervals.sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    if (a.endMinute !== b.endMinute) return b.endMinute - a.endMinute;
    return String(a.event.id) < String(b.event.id) ? -1 : 1;
  });

  const placements: TimeGridPlacement<TEvent>[] = [];
  let cluster: {
    intervals: Interval<TEvent>[];
    columns: number[];
    assigned: number[];
  } = {
    intervals: [],
    columns: [],
    assigned: [],
  };
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flushCluster = (): void => {
    const columnCount = cluster.columns.length;
    cluster.intervals.forEach((interval, index) => {
      const column = cluster.assigned[index] ?? 0;
      placements.push({
        event: interval.event,
        top: (interval.startMinute - axisStart) / axisLength,
        height: (interval.endMinute - interval.startMinute) / axisLength,
        column,
        columnCount,
        left: column / columnCount,
        width: 1 / columnCount,
        clipTop: interval.clipTop,
        clipBottom: interval.clipBottom,
      });
    });
    cluster = { intervals: [], columns: [], assigned: [] };
  };

  for (const interval of intervals) {
    if (interval.startMinute >= clusterEnd && cluster.intervals.length > 0)
      flushCluster();
    let column = cluster.columns.findIndex(
      (endsAt) => endsAt <= interval.startMinute,
    );
    if (column === -1) column = cluster.columns.length;
    cluster.columns[column] = interval.endMinute;
    cluster.intervals.push(interval);
    cluster.assigned.push(column);
    clusterEnd = Math.max(clusterEnd, interval.endMinute);
  }
  if (cluster.intervals.length > 0) flushCluster();

  return placements;
};
