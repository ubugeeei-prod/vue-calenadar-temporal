import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import type { DateRange } from "../shared/date";
import type { Temporal } from "../temporal";
import type { CalendarEventLike, EventsByDay, NormalizedEvent } from "./event";
import { eventsOnDay, indexEventsByDay, normalizeEvents } from "./event";
import type { EventLaneLayout, EventLaneOptions } from "./lanes";
import { isLaneEvent, layoutEventLanes } from "./lanes";
import type { TimeGridOptions, TimeGridPlacement } from "./time-grid";
import { layoutTimeGridDay } from "./time-grid";

// --- Types & Signatures ---

/** The state slice event handling needs; `UseCalendarReturn` satisfies it. */
export type CalendarEventsSource = {
  readonly timeZone: MaybeRefOrGetter<string>;
  readonly visibleRange: MaybeRefOrGetter<DateRange>;
};

export type UseCalendarEventsOptions = {
  /** Duration for timed events without an explicit end. Default: 60. */
  readonly defaultEventDurationMinutes?: MaybeRefOrGetter<number | undefined>;
};

export type UseCalendarEventsReturn<TEvent extends CalendarEventLike> = {
  /** Every event normalized to the display time zone. */
  readonly normalized: ComputedRef<readonly NormalizedEvent<TEvent>[]>;
  /** Per-day buckets clipped to the visible range, sorted for display. */
  readonly index: ComputedRef<EventsByDay<TEvent>>;
  /** Events of one visible day (empty outside the range). */
  readonly eventsOn: (date: Temporal.PlainDate) => readonly NormalizedEvent<TEvent>[];
  /** Timed events of one day — the week view's in-grid portion. */
  readonly timedEventsOn: (date: Temporal.PlainDate) => readonly NormalizedEvent<TEvent>[];
  /** Spanning (all-day / multi-day) events within the visible range. */
  readonly laneEvents: ComputedRef<readonly NormalizedEvent<TEvent>[]>;
  /** Lane layout for one week row (month rows, all-day strip). */
  readonly lanesFor: (week: DateRange, options?: EventLaneOptions) => EventLaneLayout<TEvent>;
  /** Column/geometry layout for one day column of the time grid. */
  readonly placementsFor: (
    day: Temporal.PlainDate,
    options?: TimeGridOptions,
  ) => readonly TimeGridPlacement<TEvent>[];
};

// --- Implementation ---

/**
 * Binds a reactive event list to the calendar: normalization and the per-day
 * index are memoized computeds; layout helpers are plain functions so views
 * can wrap exactly the rows/columns they render in their own computeds.
 */
export function useCalendarEvents<TEvent extends CalendarEventLike>(
  source: CalendarEventsSource,
  events: MaybeRefOrGetter<readonly TEvent[]>,
  options: UseCalendarEventsOptions = {},
): UseCalendarEventsReturn<TEvent> {
  const normalized = computed(() =>
    normalizeEvents(toValue(events), {
      timeZone: toValue(source.timeZone),
      defaultEventDurationMinutes: toValue(options.defaultEventDurationMinutes),
    }),
  );

  const index = computed(() => indexEventsByDay(normalized.value, toValue(source.visibleRange)));

  const laneEvents = computed(() => {
    const seen = new Set<string | number>();
    const spanning: NormalizedEvent<TEvent>[] = [];
    for (const list of index.value.values()) {
      for (const event of list) {
        if (!isLaneEvent(event) || seen.has(event.id)) continue;
        seen.add(event.id);
        spanning.push(event);
      }
    }
    return spanning;
  });

  function eventsOn(date: Temporal.PlainDate): readonly NormalizedEvent<TEvent>[] {
    return eventsOnDay(index.value, date);
  }

  function timedEventsOn(date: Temporal.PlainDate): readonly NormalizedEvent<TEvent>[] {
    return eventsOn(date).filter((event) => !isLaneEvent(event));
  }

  function lanesFor(week: DateRange, laneOptions?: EventLaneOptions): EventLaneLayout<TEvent> {
    return layoutEventLanes(laneEvents.value, week, laneOptions);
  }

  function placementsFor(
    day: Temporal.PlainDate,
    gridOptions?: TimeGridOptions,
  ): readonly TimeGridPlacement<TEvent>[] {
    return layoutTimeGridDay(timedEventsOn(day), day, gridOptions);
  }

  return { normalized, index, eventsOn, timedEventsOn, laneEvents, lanesFor, placementsFor };
}
