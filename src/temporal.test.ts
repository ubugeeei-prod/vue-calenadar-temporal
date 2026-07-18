import { describe, expect, it } from "vitest";
import { Temporal } from "./temporal";

describe("temporal ponyfill boundary", () => {
  it("parses and formats ISO dates", () => {
    const date = Temporal.PlainDate.from("2026-07-18");
    expect(date.toString()).toBe("2026-07-18");
    expect(date.year).toBe(2026);
    expect(date.month).toBe(7);
    expect(date.day).toBe(18);
  });

  it("performs calendar arithmetic", () => {
    const date = Temporal.PlainDate.from("2026-01-31");
    expect(date.add({ months: 1 }).toString()).toBe("2026-02-28");
    expect(date.add({ days: 1 }).toString()).toBe("2026-02-01");
  });

  it("compares dates", () => {
    const a = Temporal.PlainDate.from("2026-07-18");
    const b = Temporal.PlainDate.from("2026-07-19");
    expect(Temporal.PlainDate.compare(a, b)).toBe(-1);
    expect(Temporal.PlainDate.compare(a, a)).toBe(0);
  });
});
