import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";
import { Temporal } from "../temporal";
import { useDatePicker } from "./useDatePicker";

const date = Temporal.PlainDate.from;

const baseOptions = {
  locale: "en-US",
  timeZone: "Asia/Tokyo",
  today: date("2026-07-18"),
  initialFocusedDate: date("2026-07-18"),
} as const;

describe("useDatePicker — open state", () => {
  it("toggles and closes", () => {
    const picker = useDatePicker(baseOptions);
    expect(picker.open.value).toBe(false);
    picker.toggle();
    expect(picker.open.value).toBe(true);
    picker.close();
    expect(picker.open.value).toBe(false);
  });

  it("supports a controlled open state", () => {
    const open = shallowRef(true);
    const seen: boolean[] = [];
    const picker = useDatePicker({
      ...baseOptions,
      open,
      onUpdateOpen: (value) => seen.push(value),
    });
    expect(picker.open.value).toBe(true);
    picker.close();
    expect(seen).toEqual([false]);
    // Controlled: the owner applies the update.
    expect(picker.open.value).toBe(true);
    open.value = false;
    expect(picker.open.value).toBe(false);
  });
});

describe("useDatePicker — close on select", () => {
  it("closes after a single-mode pick", () => {
    const picker = useDatePicker({ ...baseOptions, initialOpen: true });
    picker.calendar.select(date("2026-07-20"));
    expect(picker.open.value).toBe(false);
    expect(picker.formattedValue.value).toBe("Jul 20, 2026");
  });

  it("keeps range mode open until the range completes", () => {
    const picker = useDatePicker({
      ...baseOptions,
      selectionMode: "range",
      initialOpen: true,
    });
    picker.calendar.select(date("2026-07-10"));
    expect(picker.open.value).toBe(true);
    picker.calendar.select(date("2026-07-14"));
    expect(picker.open.value).toBe(false);
    expect(picker.formattedValue.value).toContain("10");
    expect(picker.formattedValue.value).toContain("14");
  });

  it("never auto-closes in multiple mode and can opt out entirely", () => {
    const picker = useDatePicker({
      ...baseOptions,
      selectionMode: "multiple",
      initialOpen: true,
    });
    picker.calendar.select(date("2026-07-10"));
    picker.calendar.select(date("2026-07-11"));
    expect(picker.open.value).toBe(true);

    const sticky = useDatePicker({
      ...baseOptions,
      initialOpen: true,
      closeOnSelect: false,
    });
    sticky.calendar.select(date("2026-07-20"));
    expect(sticky.open.value).toBe(true);
  });
});

describe("useDatePicker — formatted value", () => {
  it("formats every mode and stays empty without a selection", () => {
    const empty = useDatePicker(baseOptions);
    expect(empty.formattedValue.value).toBe("");

    const multiple = useDatePicker({
      ...baseOptions,
      selectionMode: "multiple",
    });
    multiple.calendar.select(date("2026-07-10"));
    multiple.calendar.select(date("2026-07-12"));
    expect(multiple.formattedValue.value).toBe("Jul 10, 2026 and Jul 12, 2026");

    const japanese = useDatePicker({ ...baseOptions, locale: "ja-JP" });
    japanese.calendar.select(date("2026-07-20"));
    expect(japanese.formattedValue.value).toBe("2026/07/20");
  });
});
