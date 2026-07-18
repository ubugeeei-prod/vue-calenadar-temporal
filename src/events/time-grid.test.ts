import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { normalizeEvents } from "./event";
import { layoutTimeGridDay } from "./time-grid";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

const day = date("2026-07-15");

const placementOf = (
  placements: ReturnType<typeof layoutTimeGridDay>,
  id: string,
): (typeof placements)[number] => {
  const placement = placements.find((candidate) => candidate.event.id === id);
  if (placement === undefined) throw new Error(`missing placement ${id}`);
  return placement;
};

describe("layoutTimeGridDay", () => {
  it("computes fractional geometry on the full-day axis", () => {
    const events = normalizeEvents([
      { id: "meeting", start: dateTime("2026-07-15T09:00"), end: dateTime("2026-07-15T10:30") },
    ]);
    const [placement] = layoutTimeGridDay(events, day);
    expect(placement?.top).toBeCloseTo(9 / 24);
    expect(placement?.height).toBeCloseTo(1.5 / 24);
    expect(placement?.column).toBe(0);
    expect(placement?.columnCount).toBe(1);
    expect(placement?.left).toBe(0);
    expect(placement?.width).toBe(1);
  });

  it("splits overlapping events into columns within a cluster", () => {
    const events = normalizeEvents([
      { id: "a", start: dateTime("2026-07-15T09:00"), end: dateTime("2026-07-15T11:00") },
      { id: "b", start: dateTime("2026-07-15T10:00"), end: dateTime("2026-07-15T12:00") },
      { id: "c", start: dateTime("2026-07-15T11:30"), end: dateTime("2026-07-15T13:00") },
      { id: "solo", start: dateTime("2026-07-15T15:00"), end: dateTime("2026-07-15T16:00") },
    ]);
    const placements = layoutTimeGridDay(events, day);

    const a = placementOf(placements, "a");
    const b = placementOf(placements, "b");
    const c = placementOf(placements, "c");
    const solo = placementOf(placements, "solo");

    expect(a.column).toBe(0);
    expect(b.column).toBe(1);
    // "c" starts after "a" ended, so it reuses column 0 in the same cluster.
    expect(c.column).toBe(0);
    expect(a.columnCount).toBe(2);
    expect(b.columnCount).toBe(2);
    expect(c.columnCount).toBe(2);
    expect(b.left).toBeCloseTo(0.5);
    expect(b.width).toBeCloseTo(0.5);

    // Non-overlapping event forms its own single-column cluster.
    expect(solo.columnCount).toBe(1);
    expect(solo.width).toBe(1);
  });

  it("treats touching events as non-overlapping", () => {
    const events = normalizeEvents([
      { id: "first", start: dateTime("2026-07-15T09:00"), end: dateTime("2026-07-15T10:00") },
      { id: "second", start: dateTime("2026-07-15T10:00"), end: dateTime("2026-07-15T11:00") },
    ]);
    const placements = layoutTimeGridDay(events, day);
    expect(placementOf(placements, "first").columnCount).toBe(1);
    expect(placementOf(placements, "second").columnCount).toBe(1);
  });

  it("clips events crossing the axis and flags continuation", () => {
    const events = normalizeEvents([
      { id: "overnight", start: dateTime("2026-07-14T23:00"), end: dateTime("2026-07-15T01:00") },
      { id: "late", start: dateTime("2026-07-15T19:00"), end: dateTime("2026-07-15T22:00") },
    ]);
    const placements = layoutTimeGridDay(events, day, { startHour: 0, endHour: 20 });

    const overnight = placementOf(placements, "overnight");
    expect(overnight.top).toBe(0);
    expect(overnight.clipTop).toBe(true);
    expect(overnight.height).toBeCloseTo(1 / 20);

    const late = placementOf(placements, "late");
    expect(late.clipBottom).toBe(true);
    expect(late.top).toBeCloseTo(19 / 20);
    expect(late.height).toBeCloseTo(1 / 20);
  });

  it("excludes all-day events and events outside the axis", () => {
    const events = normalizeEvents([
      { id: "allday", start: date("2026-07-15") },
      { id: "dawn", start: dateTime("2026-07-15T05:00"), end: dateTime("2026-07-15T06:00") },
      { id: "kept", start: dateTime("2026-07-15T09:00"), end: dateTime("2026-07-15T10:00") },
    ]);
    const placements = layoutTimeGridDay(events, day, { startHour: 8, endHour: 20 });
    expect(placements.map((placement) => placement.event.id)).toEqual(["kept"]);
  });

  it("enforces a minimum rendered duration", () => {
    const events = normalizeEvents([
      { id: "blink", start: dateTime("2026-07-15T09:00"), end: dateTime("2026-07-15T09:05") },
    ]);
    const [placement] = layoutTimeGridDay(events, day, { minEventMinutes: 30 });
    expect(placement?.height).toBeCloseTo(0.5 / 24);
  });
});
