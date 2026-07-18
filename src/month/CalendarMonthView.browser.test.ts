import { userEvent } from "@vitest/browser/context";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import CalendarRoot from "../calendar/CalendarRoot.vue";
import { Temporal } from "../temporal";
import CalendarMonthView from "./CalendarMonthView.vue";

const date = Temporal.PlainDate.from;

const TODAY = date("2026-07-18");

type RootProps = Record<string, unknown>;

const renderMonth = (
  rootProps: RootProps = {},
  monthProps: Record<string, unknown> = {},
) =>
  render(CalendarRoot, {
    props: {
      locale: "en-US",
      timeZone: "Asia/Tokyo",
      today: TODAY,
      initialFocusedDate: TODAY,
      ...rootProps,
    },
    slots: {
      default: () => h(CalendarMonthView, monthProps),
    },
  });

describe("CalendarMonthView — structure and a11y", () => {
  it("renders an APG grid with localized weekday headers", async () => {
    const screen = renderMonth({ locale: "ja-JP", firstDayOfWeek: 7 });

    const grid = screen.getByRole("grid");
    await expect.element(grid).toBeInTheDocument();

    const headers = screen.getByRole("columnheader").elements();
    expect(headers).toHaveLength(7);
    expect(headers[0]?.textContent?.trim()).toBe("日");

    const sunday = headers[0];
    expect(sunday?.getAttribute("aria-label")).toBe("日曜日");
  });

  it("marks today with aria-current and exposes state data attributes", async () => {
    const screen = renderMonth();

    const today = screen.getByRole("gridcell", {
      name: "Saturday, July 18, 2026",
    });
    await expect.element(today).toHaveAttribute("aria-current", "date");
    await expect.element(today).toHaveAttribute("data-today", "");
    await expect.element(today).toHaveAttribute("data-weekend", "");
  });

  it("keeps exactly one cell in the tab order (roving tabindex)", () => {
    const screen = renderMonth();
    const cells = screen.getByRole("gridcell").elements();
    const tabbable = cells.filter(
      (cell) => cell.getAttribute("tabindex") === "0",
    );
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]?.getAttribute("aria-label")).toContain("July 18, 2026");
  });
});

describe("CalendarMonthView — keyboard navigation", () => {
  it("moves focus with arrows and selects with Enter", async () => {
    const onUpdate = vi.fn();
    const screen = renderMonth({ "onUpdate:modelValue": onUpdate });

    const start = screen.getByRole("gridcell", {
      name: "Saturday, July 18, 2026",
    });
    await start.click();
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ day: 18 }),
    );

    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(screen.getByRole("gridcell", { name: "Sunday, July 19, 2026" }))
      .toHaveAttribute("tabindex", "0");

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ day: 26 }),
    );
  });

  it("changes months with PageDown and announces the new title", async () => {
    const screen = renderMonth();

    const grid = screen.getByRole("grid");
    const gridElement = grid.element() as HTMLElement;
    gridElement.querySelector<HTMLElement>('[tabindex="0"]')?.focus();

    await userEvent.keyboard("{PageDown}");
    await expect
      .element(screen.getByRole("gridcell", { name: /August 18, 2026/ }))
      .toHaveAttribute("tabindex", "0");
  });

  it("inverts horizontal arrows in RTL locales", async () => {
    const screen = renderMonth({ locale: "ar-EG" });

    const gridElement = screen.getByRole("grid").element() as HTMLElement;
    gridElement.querySelector<HTMLElement>('[tabindex="0"]')?.focus();

    await userEvent.keyboard("{ArrowRight}");
    // ArrowRight moves visually right = one day backwards in RTL; the label
    // is fully localized, so the 17th renders with Arabic-Indic digits.
    const tabbable = gridElement.querySelector('[tabindex="0"]');
    expect(tabbable?.getAttribute("aria-label")).toContain("١٧");
  });
});

describe("CalendarMonthView — events", () => {
  const events = [
    {
      id: "conf",
      title: "Conference",
      start: date("2026-07-14"),
      end: date("2026-07-16"),
    },
    { id: "a", title: "Standup", start: date("2026-07-15") },
    { id: "b", title: "Review", start: date("2026-07-15") },
    { id: "c", title: "Retro", start: date("2026-07-15") },
  ];

  it("renders spanning chips with lane geometry and announces counts", async () => {
    const screen = renderMonth({ events });

    const wednesday = screen.getByRole("gridcell", {
      name: "Wednesday, July 15, 2026, 4 events",
    });
    await expect.element(wednesday).toBeInTheDocument();

    const gridElement = screen.getByRole("grid").element() as HTMLElement;
    const chips = gridElement.querySelectorAll('[data-vct="event-chip"]');
    expect(chips.length).toBe(4);

    const conference = [...chips].find(
      (chip) => chip.textContent?.trim() === "Conference",
    );
    expect(conference?.getAttribute("style")).toContain("--vct-event-span: 3");
  });

  it("caps lanes and shows a localized overflow indicator", () => {
    const screen = renderMonth({ events }, { maxEventLanes: 2 });

    const gridElement = screen.getByRole("grid").element() as HTMLElement;
    const chips = gridElement.querySelectorAll('[data-vct="event-chip"]');
    expect(chips.length).toBe(2);

    const overflow = gridElement.querySelector('[data-vct="event-overflow"]');
    expect(overflow?.textContent?.trim()).toBe("+2 more");
  });

  it("emits click:event with the normalized event", async () => {
    const onEventClick = vi.fn();
    const screen = renderMonth({ events }, { "onClick:event": onEventClick });

    const gridElement = screen.getByRole("grid").element() as HTMLElement;
    const chip = [
      ...gridElement.querySelectorAll('[data-vct="event-chip"]'),
    ].find((candidate) => candidate.textContent?.trim() === "Conference");
    (chip as HTMLElement).click();

    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick.mock.calls[0]?.[0]).toMatchObject({ id: "conf" });
  });
});

describe("CalendarMonthView — range selection preview", () => {
  it("previews the hovered range between picks", async () => {
    const screen = renderMonth({ selectionMode: "range" });

    await screen
      .getByRole("gridcell", { name: "Monday, July 13, 2026" })
      .click();
    await screen
      .getByRole("gridcell", { name: "Thursday, July 16, 2026" })
      .hover();

    const gridElement = screen.getByRole("grid").element() as HTMLElement;
    const previewed = gridElement.querySelectorAll("[data-preview]");
    expect(previewed.length).toBe(4);
  });
});
describe("CalendarMonthView — drag range selection", () => {
  const firePointer = (element: Element, type: string): void => {
    element.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0 }));
  };

  it("sweeps a range in one press-drag-release gesture", async () => {
    const onUpdate = vi.fn();
    const screen = renderMonth({
      selectionMode: "range",
      "onUpdate:modelValue": onUpdate,
    });

    const start = screen
      .getByRole("gridcell", { name: "Monday, July 13, 2026" })
      .element();
    const end = screen
      .getByRole("gridcell", { name: "Thursday, July 16, 2026" })
      .element();

    firePointer(start, "pointerdown");
    end.dispatchEvent(new MouseEvent("mouseenter"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Mid-drag the swept days preview.
    const gridElement = screen.getByRole("grid").element() as HTMLElement;
    expect(gridElement.querySelectorAll("[data-preview]").length).toBe(4);

    firePointer(end, "pointerup");

    const range = onUpdate.mock.lastCall?.[0] as {
      start: { day: number };
      end: { day: number };
    };
    expect(range.start.day).toBe(13);
    expect(range.end.day).toBe(16);
  });

  it("leaves the click–click flow intact and honors the opt-out", async () => {
    const onUpdate = vi.fn();
    const screen = renderMonth(
      { selectionMode: "range", "onUpdate:modelValue": onUpdate },
      { rangeDragSelect: false },
    );

    const start = screen
      .getByRole("gridcell", { name: "Monday, July 13, 2026" })
      .element();
    const end = screen
      .getByRole("gridcell", { name: "Thursday, July 16, 2026" })
      .element();

    // Pointer-only gestures do nothing when dragging is disabled…
    firePointer(start, "pointerdown");
    firePointer(end, "pointerup");
    expect(onUpdate).not.toHaveBeenCalled();

    // …while real clicks still build the range in two taps.
    await screen
      .getByRole("gridcell", { name: "Monday, July 13, 2026" })
      .click();
    await screen
      .getByRole("gridcell", { name: "Thursday, July 16, 2026" })
      .click();

    const range = onUpdate.mock.lastCall?.[0] as {
      start: { day: number };
      end: { day: number };
    };
    expect(range.start.day).toBe(13);
    expect(range.end.day).toBe(16);
  });

  it("keeps a plain press-release on one day as the pending first pick", async () => {
    const onUpdate = vi.fn();
    const screen = renderMonth({
      selectionMode: "range",
      "onUpdate:modelValue": onUpdate,
    });

    const day = screen
      .getByRole("gridcell", { name: "Monday, July 13, 2026" })
      .element();

    firePointer(day, "pointerdown");
    firePointer(day, "pointerup");
    day.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // First pick clears the model (null) and stays pending — no range yet.
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.lastCall?.[0]).toBeNull();
  });
});
