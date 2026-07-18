import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { pickRange, rangeEdge, rangePreview, selectionContains, toggleMultiple } from "./selection";

const date = Temporal.PlainDate.from;

describe("toggleMultiple", () => {
  it("adds missing dates sorted and removes present ones", () => {
    const first = toggleMultiple([], date("2026-07-18"));
    const second = toggleMultiple(first, date("2026-07-10"));
    expect(second.map(String)).toEqual(["2026-07-10", "2026-07-18"]);

    const removed = toggleMultiple(second, date("2026-07-18"));
    expect(removed.map(String)).toEqual(["2026-07-10"]);
  });
});

describe("pickRange", () => {
  it("clears on the first pick and completes on the second", () => {
    const first = pickRange(null, date("2026-07-18"));
    expect(first.pending?.toString()).toBe("2026-07-18");
    expect(first.value).toBeNull();

    const second = pickRange(first.pending, date("2026-07-10"));
    expect(second.pending).toBeNull();
    expect(second.value?.start.toString()).toBe("2026-07-10");
    expect(second.value?.end.toString()).toBe("2026-07-18");
  });
});

describe("rangePreview", () => {
  it("previews only while both endpoints exist", () => {
    expect(rangePreview(null, date("2026-07-18"))).toBeNull();
    expect(rangePreview(date("2026-07-18"), null)).toBeNull();
    const preview = rangePreview(date("2026-07-18"), date("2026-07-15"));
    expect(preview?.start.toString()).toBe("2026-07-15");
    expect(preview?.end.toString()).toBe("2026-07-18");
  });
});

describe("selectionContains", () => {
  it("handles every value shape", () => {
    expect(selectionContains(null, date("2026-07-18"))).toBe(false);
    expect(selectionContains(date("2026-07-18"), date("2026-07-18"))).toBe(true);
    expect(selectionContains([date("2026-07-10"), date("2026-07-18")], date("2026-07-18"))).toBe(
      true,
    );
    expect(selectionContains([date("2026-07-10")], date("2026-07-18"))).toBe(false);
    const range = { start: date("2026-07-10"), end: date("2026-07-20") };
    expect(selectionContains(range, date("2026-07-15"))).toBe(true);
    expect(selectionContains(range, date("2026-07-21"))).toBe(false);
  });
});

describe("rangeEdge", () => {
  const range = { start: date("2026-07-10"), end: date("2026-07-20") };

  it("labels endpoints", () => {
    expect(rangeEdge(range, date("2026-07-10"))).toBe("start");
    expect(rangeEdge(range, date("2026-07-20"))).toBe("end");
    expect(rangeEdge(range, date("2026-07-15"))).toBeNull();
    expect(rangeEdge(null, date("2026-07-15"))).toBeNull();
    const single = { start: date("2026-07-10"), end: date("2026-07-10") };
    expect(rangeEdge(single, date("2026-07-10"))).toBe("both");
  });
});
