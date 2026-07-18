import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";
import { useCalendar } from "../calendar/useCalendar";
import { Temporal } from "../temporal";
import type { CalendarEventLike } from "./event";
import { useCalendarEvents } from "./useCalendarEvents";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

type DemoEvent = CalendarEventLike & { readonly color: string };

describe("useCalendarEvents", () => {
  it("plugs into useCalendar structurally and stays reactive", () => {
    const calendar = useCalendar({
      locale: "en-US",
      timeZone: "Asia/Tokyo",
      today: date("2026-07-18"),
      initialFocusedDate: date("2026-07-18"),
    });
    const events = shallowRef<readonly DemoEvent[]>([
      { id: "lunch", start: dateTime("2026-07-15T12:00"), color: "peach" },
    ]);

    const bound = useCalendarEvents(calendar, events);
    expect(bound.eventsOn(date("2026-07-15"))).toHaveLength(1);
    // The generic event type flows through normalization untouched.
    expect(bound.eventsOn(date("2026-07-15"))[0]?.event.color).toBe("peach");

    events.value = [...events.value, { id: "spa", start: date("2026-07-15"), color: "mint" }];
    expect(bound.eventsOn(date("2026-07-15"))).toHaveLength(2);

    // Events outside the visible month are indexed out.
    events.value = [{ id: "far", start: date("2026-09-01"), color: "sky" }];
    expect(bound.eventsOn(date("2026-09-01"))).toHaveLength(0);
    expect(bound.normalized.value).toHaveLength(1);
  });

  it("separates lane events from timed ones and lays both out", () => {
    const bound = useCalendarEvents(
      {
        timeZone: "Asia/Tokyo",
        visibleRange: { start: date("2026-07-13"), end: date("2026-07-19") },
      },
      shallowRef<readonly CalendarEventLike[]>([
        { id: "conf", start: date("2026-07-14"), end: date("2026-07-16") },
        { id: "standup", start: dateTime("2026-07-15T09:00") },
        { id: "review", start: dateTime("2026-07-15T09:30") },
      ]),
    );

    expect(bound.laneEvents.value.map((event) => event.id)).toEqual(["conf"]);
    expect(bound.timedEventsOn(date("2026-07-15")).map((event) => event.id)).toEqual([
      "standup",
      "review",
    ]);

    const lanes = bound.lanesFor({ start: date("2026-07-13"), end: date("2026-07-19") });
    expect(lanes.segments).toHaveLength(1);
    expect(lanes.segments[0]?.span).toBe(3);

    const placements = bound.placementsFor(date("2026-07-15"));
    expect(placements).toHaveLength(2);
    expect(placements[0]?.columnCount).toBe(2);
  });
});
