import { describe, expect, it } from "vitest";
import { Temporal } from "../temporal";
import { applyGridIntent, resolveGridKey } from "./keyboard";

const date = Temporal.PlainDate.from;

describe("resolveGridKey", () => {
  it("maps APG grid keys", () => {
    expect(resolveGridKey({ key: "ArrowRight" }, "ltr")).toEqual({ kind: "move-days", days: 1 });
    expect(resolveGridKey({ key: "ArrowLeft" }, "ltr")).toEqual({ kind: "move-days", days: -1 });
    expect(resolveGridKey({ key: "ArrowDown" }, "ltr")).toEqual({ kind: "move-days", days: 7 });
    expect(resolveGridKey({ key: "ArrowUp" }, "ltr")).toEqual({ kind: "move-days", days: -7 });
    expect(resolveGridKey({ key: "PageDown" }, "ltr")).toEqual({ kind: "move-months", months: 1 });
    expect(resolveGridKey({ key: "PageUp", shiftKey: true }, "ltr")).toEqual({
      kind: "move-years",
      years: -1,
    });
    expect(resolveGridKey({ key: "Home" }, "ltr")).toEqual({ kind: "week-edge", edge: "start" });
    expect(resolveGridKey({ key: "End" }, "ltr")).toEqual({ kind: "week-edge", edge: "end" });
    expect(resolveGridKey({ key: "Enter" }, "ltr")).toEqual({ kind: "select" });
    expect(resolveGridKey({ key: " " }, "ltr")).toEqual({ kind: "select" });
    expect(resolveGridKey({ key: "a" }, "ltr")).toBeUndefined();
  });

  it("inverts horizontal arrows in RTL", () => {
    expect(resolveGridKey({ key: "ArrowRight" }, "rtl")).toEqual({ kind: "move-days", days: -1 });
    expect(resolveGridKey({ key: "ArrowLeft" }, "rtl")).toEqual({ kind: "move-days", days: 1 });
    expect(resolveGridKey({ key: "ArrowDown" }, "rtl")).toEqual({ kind: "move-days", days: 7 });
  });
});

describe("applyGridIntent", () => {
  const saturday = date("2026-07-18");

  it("computes focus targets", () => {
    expect(applyGridIntent({ kind: "move-days", days: 7 }, saturday, 1).focus?.toString()).toBe(
      "2026-07-25",
    );
    expect(applyGridIntent({ kind: "move-months", months: 1 }, saturday, 1).focus?.toString()).toBe(
      "2026-08-18",
    );
    expect(applyGridIntent({ kind: "move-years", years: -1 }, saturday, 1).focus?.toString()).toBe(
      "2025-07-18",
    );
    expect(
      applyGridIntent({ kind: "week-edge", edge: "start" }, saturday, 1).focus?.toString(),
    ).toBe("2026-07-13");
    expect(applyGridIntent({ kind: "week-edge", edge: "end" }, saturday, 7).focus?.toString()).toBe(
      "2026-07-18",
    );
  });

  it("signals selection without moving focus", () => {
    expect(applyGridIntent({ kind: "select" }, saturday, 1)).toEqual({ select: true });
  });
});
