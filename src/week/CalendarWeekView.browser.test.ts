import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import CalendarRoot from "../calendar/CalendarRoot.vue";
import { Temporal } from "../temporal";
import CalendarWeekView from "./CalendarWeekView.vue";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

const TODAY = date("2026-07-18");

const EVENTS = [
  {
    id: "kickoff",
    title: "Kickoff",
    start: dateTime("2026-07-15T09:00"),
    end: dateTime("2026-07-15T10:30"),
  },
  {
    id: "sync",
    title: "Sync",
    start: dateTime("2026-07-15T09:30"),
    end: dateTime("2026-07-15T10:00"),
  },
  {
    id: "offsite",
    title: "Offsite",
    start: date("2026-07-14"),
    end: date("2026-07-16"),
  },
];

const renderWeek = (
  rootProps: Record<string, unknown> = {},
  weekProps: Record<string, unknown> = {},
) =>
  render(CalendarRoot, {
    props: {
      locale: "en-US",
      timeZone: "Asia/Tokyo",
      today: TODAY,
      initialFocusedDate: TODAY,
      initialView: "week",
      events: EVENTS,
      ...rootProps,
    },
    slots: {
      default: () => h(CalendarWeekView, weekProps),
    },
  });

const gridElement = (screen: { baseElement: Element }): HTMLElement => {
  const element = screen.baseElement.querySelector('[data-vct="week-grid"]');
  if (element === null) throw new Error("week grid not rendered");
  return element as HTMLElement;
};

describe("CalendarWeekView — layout", () => {
  it("renders seven day columns and a localized hour axis", () => {
    const screen = renderWeek(
      { locale: "ja-JP" },
      { startHour: 9, endHour: 12 },
    );

    const grid = gridElement(screen);
    expect(grid.querySelectorAll('[data-vct="day-column"]')).toHaveLength(7);

    const labels = [...grid.querySelectorAll('[data-vct="hour-label"]')].map(
      (label) => label.textContent?.trim(),
    );
    expect(labels).toEqual(["9時", "10時", "11時"]);
  });

  it("positions timed events with fractional custom properties and splits overlaps", () => {
    const screen = renderWeek();

    const grid = gridElement(screen);
    const kickoff = [...grid.querySelectorAll('[data-vct="time-event"]')].find(
      (event) => event.textContent?.includes("Kickoff"),
    );
    const style = kickoff?.getAttribute("style") ?? "";
    expect(style).toContain("--vct-event-top: 0.375");
    expect(style).toContain("--vct-event-width: 0.5");
  });

  it("renders spanning events in the all-day strip with continuation flags", () => {
    const screen = renderWeek();

    const grid = gridElement(screen);
    const chip = grid.querySelector('[data-vct="allday-event"]');
    expect(chip?.textContent).toContain("Offsite");
    expect(chip?.getAttribute("aria-label")).toContain("All day");
    expect(chip?.getAttribute("style")).toContain("--vct-event-span: 3");
  });

  it("hides the all-day strip when nothing spans", () => {
    const screen = renderWeek({ events: [] });
    expect(
      gridElement(screen).querySelector('[data-vct="allday-row"]'),
    ).toBeNull();
  });
});

describe("CalendarWeekView — interactions", () => {
  it("emits click:slot with the clicked hour as a PlainDateTime", () => {
    const onSlot = vi.fn();
    const screen = renderWeek({}, { "onClick:slot": onSlot, startHour: 8 });

    const grid = gridElement(screen);
    const monday = grid.querySelectorAll('[data-vct="day-column"]')[0];
    const secondSlot = monday?.querySelectorAll('[data-vct="hour-slot"]')[1];
    (secondSlot as HTMLElement).click();

    expect(onSlot).toHaveBeenCalledTimes(1);
    const [dateTimeArg] = onSlot.mock.calls[0] ?? [];
    // en-US weeks start on Sunday, so the first column is Jul 12.
    expect(String(dateTimeArg)).toBe("2026-07-12T09:00:00");
  });

  it("emits click:event from both timed and all-day events", () => {
    const onEvent = vi.fn();
    const screen = renderWeek({}, { "onClick:event": onEvent });

    const grid = gridElement(screen);
    const timed = [...grid.querySelectorAll('[data-vct="time-event"]')].find(
      (event) => event.textContent?.includes("Sync"),
    );
    (timed as HTMLElement).click();
    const allDay = grid.querySelector('[data-vct="allday-event"]');
    (allDay as HTMLElement).click();

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[0]?.[0]).toMatchObject({ id: "sync" });
    expect(onEvent.mock.calls[1]?.[0]).toMatchObject({ id: "offsite" });
  });

  it("supports rolling day counts", () => {
    const screen = renderWeek({}, { days: 3 });
    const headers = gridElement(screen).querySelectorAll(
      '[data-vct="week-day-header"]',
    );
    expect(headers).toHaveLength(3);
    expect(headers[0]?.getAttribute("aria-label")).toContain("July 18, 2026");
  });
});
