import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import CalendarRoot from "../calendar/CalendarRoot.vue";
import { Temporal } from "../temporal";
import CalendarYearView from "./CalendarYearView.vue";

const date = Temporal.PlainDate.from;

const TODAY = date("2026-07-18");

const renderYear = (
  rootProps: Record<string, unknown> = {},
  yearProps: Record<string, unknown> = {},
) =>
  render(CalendarRoot, {
    props: {
      locale: "en-US",
      timeZone: "Asia/Tokyo",
      today: TODAY,
      initialFocusedDate: TODAY,
      initialView: "year",
      ...rootProps,
    },
    slots: {
      default: () => h(CalendarYearView, yearProps),
    },
  });

const yearElement = (screen: { baseElement: Element }): HTMLElement => {
  const element = screen.baseElement.querySelector('[data-vct="year-grid"]');
  if (element === null) throw new Error("year grid not rendered");
  return element as HTMLElement;
};

describe("CalendarYearView", () => {
  it("renders twelve localized mini months and flags the current one", () => {
    const screen = renderYear({ locale: "ja-JP" });

    const year = yearElement(screen);
    const months = year.querySelectorAll('[data-vct="year-month"]');
    expect(months).toHaveLength(12);

    const labels = [
      ...year.querySelectorAll('[data-vct="year-month-label"]'),
    ].map((label) => label.textContent?.trim());
    expect(labels[0]).toBe("1月");
    expect(labels[6]).toBe("7月");
    expect(months[6]?.hasAttribute("data-current")).toBe(true);
    expect(months[5]?.hasAttribute("data-current")).toBe(false);
  });

  it("marks days that hold events", () => {
    const screen = renderYear({
      events: [{ id: "launch", title: "Launch", start: date("2026-03-14") }],
    });

    const withEvents = [
      ...yearElement(screen).querySelectorAll("[data-has-events]"),
    ];
    // The date appears twice: in March and as an outside day of February.
    expect(withEvents.length).toBeGreaterThan(0);
    for (const day of withEvents) {
      expect(day.getAttribute("aria-label")).toContain("March 14, 2026");
    }
  });

  it("jumps to the month view when a day is clicked", async () => {
    const onView = vi.fn();
    const onDay = vi.fn();
    const screen = renderYear(
      { "onUpdate:view": onView },
      { "onClick:day": onDay },
    );

    const march = yearElement(screen).querySelectorAll(
      '[data-vct="year-month"]',
    )[2];
    const day = [
      ...(march?.querySelectorAll('[data-vct="year-day"]') ?? []),
    ].find((candidate) =>
      candidate.getAttribute("aria-label")?.includes("March 14"),
    );
    (day as HTMLElement).click();

    expect(onDay).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith("month");
  });

  it("keeps the view unchanged when navigation is disabled", () => {
    const onView = vi.fn();
    const screen = renderYear(
      { "onUpdate:view": onView },
      { navigateOnDayClick: false },
    );

    const day = yearElement(screen).querySelector('[data-vct="year-day"]');
    (day as HTMLElement).click();
    expect(onView).not.toHaveBeenCalled();
  });
});
