import { renderToString } from "@vue/server-renderer";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import CalendarHeader from "./calendar/CalendarHeader.vue";
import CalendarRoot from "./calendar/CalendarRoot.vue";
import CalendarTitle from "./calendar/CalendarTitle.vue";
import DatePickerContent from "./date-picker/DatePickerContent.vue";
import DatePickerRoot from "./date-picker/DatePickerRoot.vue";
import DatePickerTrigger from "./date-picker/DatePickerTrigger.vue";
import CalendarMonthView from "./month/CalendarMonthView.vue";
import { Temporal } from "./temporal";
import CalendarWeekView from "./week/CalendarWeekView.vue";
import CalendarYearView from "./year/CalendarYearView.vue";

const date = Temporal.PlainDate.from;
const dateTime = Temporal.PlainDateTime.from;

const TODAY = date("2026-07-18");

const BASE_PROPS = {
  locale: "en-US",
  timeZone: "Asia/Tokyo",
  today: TODAY,
  initialFocusedDate: TODAY,
} as const;

const renderCalendar = (
  rootProps: Record<string, unknown>,
  children: () => unknown,
): Promise<string> =>
  renderToString(
    createSSRApp({
      render: () => h(CalendarRoot, rootProps, { default: children }),
    }),
  );

describe("SSR — month view", () => {
  it("renders the full grid markup on the server", async () => {
    const html = await renderCalendar(BASE_PROPS, () => [
      h(CalendarHeader, null, {
        default: () => h(CalendarTitle),
      }),
      h(CalendarMonthView),
    ]);

    expect(html).toContain('role="grid"');
    expect(html).toContain("July 2026");
    expect(html).toContain('aria-current="date"');
    expect((html.match(/role="gridcell"/gu) ?? []).length).toBe(35);
  });

  it("is deterministic for a fixed today", async () => {
    const first = await renderCalendar(BASE_PROPS, () => h(CalendarMonthView));
    const second = await renderCalendar(BASE_PROPS, () => h(CalendarMonthView));
    expect(first).toBe(second);
  });

  it("renders event chips on the server", async () => {
    const html = await renderCalendar(
      {
        ...BASE_PROPS,
        events: [
          { id: "conf", title: "Conference", start: date("2026-07-14") },
        ],
      },
      () => h(CalendarMonthView),
    );
    expect(html).toContain("Conference");
    expect(html).toContain("1 event");
  });
});

describe("SSR — week view", () => {
  it("renders the time grid without the client-only now indicator", async () => {
    const html = await renderCalendar(
      {
        ...BASE_PROPS,
        initialView: "week",
        events: [
          {
            id: "kickoff",
            title: "Kickoff",
            start: dateTime("2026-07-15T09:00"),
          },
        ],
      },
      () => h(CalendarWeekView),
    );

    expect(html).toContain('data-vct="week-grid"');
    expect(html).toContain("Kickoff");
    expect(html).not.toContain('data-vct="now-line"');
  });
});

describe("SSR — year view", () => {
  it("renders twelve months on the server", async () => {
    const html = await renderCalendar(
      { ...BASE_PROPS, initialView: "year" },
      () => h(CalendarYearView),
    );
    expect((html.match(/data-vct="year-month"/gu) ?? []).length).toBe(12);
  });
});

describe("SSR — date picker", () => {
  it("renders only the trigger while closed", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(DatePickerRoot, BASE_PROPS, {
            default: () => [h(DatePickerTrigger), h(DatePickerContent)],
          }),
      }),
    );

    expect(html).toContain("Choose date");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('role="dialog"');
  });

  it("renders the open dialog when initialOpen is set", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            DatePickerRoot,
            { ...BASE_PROPS, initialOpen: true },
            {
              default: () => [h(DatePickerTrigger), h(DatePickerContent)],
            },
          ),
      }),
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('role="grid"');
  });
});
