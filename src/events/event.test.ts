import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { eventsOnDay, indexEventsByDay, normalizeEvent, normalizeEvents } from "./event";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

const TOKYO = "Asia/Tokyo";

describe("normalizeEvent — all-day", () => {
  it("treats PlainDate input as all-day with an inclusive end", () => {
    const normalized = normalizeEvent({
      id: "camp",
      start: date("2026-07-18"),
      end: date("2026-07-20"),
    });
    expect(normalized.allDay).toBe(true);
    expect(normalized.startDate.toString()).toBe("2026-07-18");
    expect(normalized.endDate.toString()).toBe("2026-07-20");
    expect(normalized.spanDays).toBe(3);
    expect(normalized.start.toString()).toBe("2026-07-18T00:00:00");
    expect(normalized.end.toString()).toBe("2026-07-21T00:00:00");
  });

  it("defaults the end to the start day and swaps reversed ranges", () => {
    const single = normalizeEvent({ id: 1, start: date("2026-07-18") });
    expect(single.spanDays).toBe(1);
    expect(single.endDate.toString()).toBe("2026-07-18");

    const reversed = normalizeEvent({
      id: 2,
      start: date("2026-07-20"),
      end: date("2026-07-18"),
    });
    expect(reversed.startDate.toString()).toBe("2026-07-18");
    expect(reversed.endDate.toString()).toBe("2026-07-20");
  });

  it("honors an explicit allDay flag on timed input", () => {
    const normalized = normalizeEvent({
      id: 3,
      start: dateTime("2026-07-18T09:30"),
      end: dateTime("2026-07-19T10:00"),
      allDay: true,
    });
    expect(normalized.allDay).toBe(true);
    expect(normalized.startDate.toString()).toBe("2026-07-18");
    expect(normalized.endDate.toString()).toBe("2026-07-19");
    expect(normalized.spanDays).toBe(2);
  });
});

describe("normalizeEvent — timed", () => {
  it("keeps wall-clock times and applies the default duration", () => {
    const normalized = normalizeEvent({ id: 4, start: dateTime("2026-07-18T09:30") });
    expect(normalized.allDay).toBe(false);
    expect(normalized.start.toString()).toBe("2026-07-18T09:30:00");
    expect(normalized.end.toString()).toBe("2026-07-18T10:30:00");
    expect(normalized.spanDays).toBe(1);

    const short = normalizeEvent(
      { id: 5, start: dateTime("2026-07-18T09:30") },
      { defaultEventDurationMinutes: 15 },
    );
    expect(short.end.toString()).toBe("2026-07-18T09:45:00");
  });

  it("swaps reversed endpoints", () => {
    const normalized = normalizeEvent({
      id: 6,
      start: dateTime("2026-07-18T11:00"),
      end: dateTime("2026-07-18T10:00"),
    });
    expect(normalized.start.toString()).toBe("2026-07-18T10:00:00");
    expect(normalized.end.toString()).toBe("2026-07-18T11:00:00");
  });

  it("spans days only when time actually spills over", () => {
    const overnight = normalizeEvent({
      id: 7,
      start: dateTime("2026-07-18T23:00"),
      end: dateTime("2026-07-19T01:00"),
    });
    expect(overnight.spanDays).toBe(2);
    expect(overnight.endDate.toString()).toBe("2026-07-19");

    const untilMidnight = normalizeEvent({
      id: 8,
      start: dateTime("2026-07-18T22:00"),
      end: dateTime("2026-07-19T00:00"),
    });
    expect(untilMidnight.spanDays).toBe(1);
    expect(untilMidnight.endDate.toString()).toBe("2026-07-18");
  });
});

describe("normalizeEvent — absolute inputs and time zones", () => {
  const instant = Temporal.Instant.from("2026-07-18T15:00:00Z");

  it("resolves Instant into the display time zone", () => {
    const tokyo = normalizeEvent({ id: 9, start: instant }, { timeZone: TOKYO });
    expect(tokyo.start.toString()).toBe("2026-07-19T00:00:00");
    expect(tokyo.startDate.toString()).toBe("2026-07-19");

    const newYork = normalizeEvent({ id: 9, start: instant }, { timeZone: "America/New_York" });
    expect(newYork.start.toString()).toBe("2026-07-18T11:00:00");
  });

  it("re-zones ZonedDateTime input", () => {
    const zoned = Temporal.ZonedDateTime.from("2026-07-18T10:00[America/New_York]");
    const normalized = normalizeEvent({ id: 10, start: zoned }, { timeZone: TOKYO });
    expect(normalized.start.toString()).toBe("2026-07-18T23:00:00");
  });

  it("accepts Temporal-like values from another realm or polyfill copy", () => {
    const foreign = {
      year: 2026,
      month: 7,
      day: 18,
      toString: () => "2026-07-18",
    } as unknown as Temporal.PlainDate;
    const normalized = normalizeEvent({ id: 11, start: foreign });
    expect(normalized.allDay).toBe(true);
    expect(normalized.startDate.toString()).toBe("2026-07-18");
  });
});

describe("indexEventsByDay / eventsOnDay", () => {
  const range = { start: date("2026-07-13"), end: date("2026-07-19") };
  const events = normalizeEvents(
    [
      { id: "timed", start: dateTime("2026-07-15T09:00"), end: dateTime("2026-07-15T10:00") },
      { id: "later", start: dateTime("2026-07-15T13:00"), end: dateTime("2026-07-15T14:00") },
      { id: "allday", start: date("2026-07-15") },
      { id: "span", start: date("2026-07-14"), end: date("2026-07-16") },
      { id: "before-range", start: date("2026-07-01") },
      { id: "clipped", start: date("2026-07-10"), end: date("2026-07-14") },
    ],
    { timeZone: TOKYO },
  );
  const index = indexEventsByDay(events, range);

  it("buckets events into every day they touch, clipped to the range", () => {
    expect(eventsOnDay(index, date("2026-07-15")).map((event) => event.id)).toEqual([
      "span",
      "allday",
      "timed",
      "later",
    ]);
    expect(eventsOnDay(index, date("2026-07-13")).map((event) => event.id)).toEqual(["clipped"]);
    expect(eventsOnDay(index, date("2026-07-01"))).toEqual([]);
    expect(eventsOnDay(index, date("2026-07-19"))).toEqual([]);
  });

  it("sorts multi-day and all-day events ahead of timed ones", () => {
    const day = eventsOnDay(index, date("2026-07-14"));
    expect(day.map((event) => event.id)).toEqual(["clipped", "span"]);
  });
});
