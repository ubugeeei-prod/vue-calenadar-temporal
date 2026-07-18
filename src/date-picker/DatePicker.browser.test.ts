import { userEvent } from "@vitest/browser/context";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { Temporal } from "../temporal";
import DatePickerContent from "./DatePickerContent.vue";
import DatePickerRoot from "./DatePickerRoot.vue";
import DatePickerTrigger from "./DatePickerTrigger.vue";

const date = Temporal.PlainDate.from;

const TODAY = date("2026-07-18");

const renderPicker = (rootProps: Record<string, unknown> = {}) =>
  render(DatePickerRoot, {
    props: {
      locale: "en-US",
      timeZone: "Asia/Tokyo",
      today: TODAY,
      initialFocusedDate: TODAY,
      ...rootProps,
    },
    slots: {
      default: () => [h(DatePickerTrigger), h(DatePickerContent)],
    },
  });

describe("DatePicker — open and close", () => {
  it("opens the dialog from the trigger and moves focus into the grid", async () => {
    const screen = renderPicker();

    const trigger = screen.getByRole("button", { name: "Choose date" });
    await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();

    const dialog = screen.getByRole("dialog", { name: "Choose date" });
    await expect.element(dialog).toBeInTheDocument();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");

    // Focus dives into the focused date's cell.
    await expect
      .element(screen.getByRole("gridcell", { name: /July 18, 2026/ }))
      .toHaveFocus();
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const screen = renderPicker();
    const trigger = screen.getByRole("button", { name: "Choose date" });
    await trigger.click();

    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const screen = renderPicker();
    await screen.getByRole("button", { name: "Choose date" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(document.body);

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("DatePicker — selection", () => {
  it("selects a date, emits the model, closes, and shows the formatted value", async () => {
    const onUpdate = vi.fn();
    const screen = renderPicker({ "onUpdate:modelValue": onUpdate });

    await screen.getByRole("button", { name: "Choose date" }).click();
    await screen
      .getByRole("gridcell", { name: "Monday, July 20, 2026" })
      .click();

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026, month: 7, day: 20 }),
    );
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: /Jul 20, 2026/ }))
      .toBeInTheDocument();
  });

  it("keeps a range picker open until the second pick", async () => {
    const screen = renderPicker({ selectionMode: "range" });

    await screen.getByRole("button", { name: "Choose date" }).click();
    await screen
      .getByRole("gridcell", { name: "Monday, July 13, 2026" })
      .click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

    await screen
      .getByRole("gridcell", { name: "Thursday, July 16, 2026" })
      .click();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: /Jul 13\s?–\s?16, 2026/ }))
      .toBeInTheDocument();
  });

  it("localizes the formatted trigger value", async () => {
    const screen = renderPicker({ locale: "ja-JP" });

    await screen.getByRole("button", { name: "Choose date" }).click();
    await screen.getByRole("gridcell", { name: /2026年7月20日/ }).click();

    await expect
      .element(screen.getByRole("button", { name: "2026/07/20" }))
      .toBeInTheDocument();
  });
});
