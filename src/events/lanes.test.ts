import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { normalizeEvents } from "./event";
import { isLaneEvent, layoutEventLanes } from "./lanes";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

const week = { start: date("2026-07-13"), end: date("2026-07-19") };

const segmentOf = (
  layout: ReturnType<typeof layoutEventLanes>,
  id: string,
): (typeof layout.segments)[number] => {
  const segment = layout.segments.find((candidate) => candidate.event.id === id);
  if (segment === undefined) throw new Error(`missing segment ${id}`);
  return segment;
};

describe("isLaneEvent", () => {
  it("selects all-day and multi-day events", () => {
    const [allDay, multiDay, timed] = normalizeEvents([
      { id: "a", start: date("2026-07-15") },
      { id: "b", start: dateTime("2026-07-14T22:00"), end: dateTime("2026-07-15T02:00") },
      { id: "c", start: dateTime("2026-07-15T09:00") },
    ]);
    expect(allDay !== undefined && isLaneEvent(allDay)).toBe(true);
    expect(multiDay !== undefined && isLaneEvent(multiDay)).toBe(true);
    expect(timed !== undefined && isLaneEvent(timed)).toBe(false);
  });
});

describe("layoutEventLanes", () => {
  it("packs segments greedily into the lowest free lane", () => {
    const events = normalizeEvents([
      { id: "span", start: date("2026-07-14"), end: date("2026-07-16") },
      { id: "monday", start: date("2026-07-13") },
      { id: "tuesday", start: date("2026-07-14") },
      { id: "friday", start: date("2026-07-17") },
    ]);
    const layout = layoutEventLanes(events, week);

    expect(segmentOf(layout, "monday").lane).toBe(0);
    expect(segmentOf(layout, "monday").startColumn).toBe(0);
    // The three-day span wins lane 0 on its start column…
    expect(segmentOf(layout, "span").lane).toBe(0);
    expect(segmentOf(layout, "span").startColumn).toBe(1);
    expect(segmentOf(layout, "span").span).toBe(3);
    // …pushing the same-day single event down a lane.
    expect(segmentOf(layout, "tuesday").lane).toBe(1);
    // Friday is free again on lane 0.
    expect(segmentOf(layout, "friday").lane).toBe(0);
    expect(layout.laneCount).toBe(2);
    expect(layout.overflow.every((count) => count === 0)).toBe(true);
  });

  it("clips segments to the week and flags continuation", () => {
    const events = normalizeEvents([
      { id: "before", start: date("2026-07-11"), end: date("2026-07-14") },
      { id: "after", start: date("2026-07-18"), end: date("2026-07-22") },
    ]);
    const layout = layoutEventLanes(events, week);

    const before = segmentOf(layout, "before");
    expect(before.startColumn).toBe(0);
    expect(before.span).toBe(2);
    expect(before.continuesBefore).toBe(true);
    expect(before.continuesAfter).toBe(false);

    const after = segmentOf(layout, "after");
    expect(after.startColumn).toBe(5);
    expect(after.span).toBe(2);
    expect(after.continuesAfter).toBe(true);
  });

  it("drops events beyond maxLanes into per-day overflow", () => {
    const events = normalizeEvents([
      { id: "a", start: date("2026-07-15") },
      { id: "b", start: date("2026-07-15") },
      { id: "c", start: date("2026-07-15") },
      { id: "d", start: date("2026-07-15"), end: date("2026-07-16") },
    ]);
    const layout = layoutEventLanes(events, week, { maxLanes: 2 });

    expect(layout.segments).toHaveLength(2);
    expect(layout.laneCount).toBe(2);
    // Only Wednesday (column 2) overflows: the span and "a" fill its lanes.
    expect(layout.overflow).toEqual([0, 0, 2, 0, 0, 0, 0]);
    expect(layout.hiddenEvents.map((event) => event.id)).toEqual(["b", "c"]);
    // The span sorts first (longer), so it stays visible.
    expect(segmentOf(layout, "d").lane).toBe(0);
  });

  it("ignores events outside the week", () => {
    const events = normalizeEvents([{ id: "faraway", start: date("2026-08-01") }]);
    const layout = layoutEventLanes(events, week);
    expect(layout.segments).toHaveLength(0);
    expect(layout.laneCount).toBe(0);
  });
});
