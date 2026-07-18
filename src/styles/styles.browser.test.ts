import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import CalendarRoot from "../calendar/CalendarRoot.vue";
import CalendarMonthView from "../month/CalendarMonthView.vue";
import { Temporal } from "../temporal";
import CalendarWeekView from "../week/CalendarWeekView.vue";
import "./style.css";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

const TODAY = date("2026-07-18");

const BASE = {
  locale: "en-US",
  timeZone: "Asia/Tokyo",
  today: TODAY,
  initialFocusedDate: TODAY,
} as const;

const WEEK_EVENTS = [
  { id: "sync", title: "Sync", start: dateTime("2026-07-15T09:00") },
];

describe("opt-in stylesheets", () => {
  it("applies structural layout from base.css", () => {
    const screen = render(CalendarRoot, {
      props: BASE,
      slots: { default: () => h(CalendarMonthView) },
    });

    const row = screen.baseElement.querySelector('[data-vct="week-row"]');
    expect(row).not.toBeNull();
    expect(getComputedStyle(row as Element).display).toBe("grid");

    const cell = screen.baseElement.querySelector('[data-vct="day"]');
    expect(getComputedStyle(cell as Element).position).toBe("relative");
  });

  it("positions timed events absolutely inside their day column", () => {
    const screen = render(CalendarRoot, {
      props: {
        ...BASE,
        initialView: "week",
        events: WEEK_EVENTS,
      },
      slots: { default: () => h(CalendarWeekView) },
    });

    const event = screen.baseElement.querySelector('[data-vct="time-event"]');
    expect(getComputedStyle(event as Element).position).toBe("absolute");
  });

  it("exposes the theme's easing and color tokens", () => {
    const screen = render(CalendarRoot, {
      props: BASE,
      slots: { default: () => h(CalendarMonthView) },
    });

    const root = screen.baseElement.querySelector('[data-vct="root"]');
    const styles = getComputedStyle(root as Element);
    expect(styles.getPropertyValue("--vct-ease-out").trim()).toBe(
      "cubic-bezier(0.22, 1, 0.36, 1)",
    );
    expect(styles.getPropertyValue("--vct-accent").trim()).not.toBe("");
  });
});
