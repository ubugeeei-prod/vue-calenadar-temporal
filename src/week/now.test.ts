import { describe, expect, it } from "vitest";
import { axisFraction } from "./now";

describe("axisFraction", () => {
  it("maps minutes onto the full-day axis", () => {
    expect(axisFraction(0, 0, 24)).toBe(0);
    expect(axisFraction(12 * 60, 0, 24)).toBeCloseTo(0.5);
    expect(axisFraction(23 * 60 + 59, 0, 24)).toBeCloseTo(
      (23 * 60 + 59) / 1440,
    );
  });

  it("maps onto a sliced axis and rejects outside minutes", () => {
    expect(axisFraction(8 * 60, 8, 20)).toBe(0);
    expect(axisFraction(14 * 60, 8, 20)).toBeCloseTo(0.5);
    expect(axisFraction(7 * 60, 8, 20)).toBeNull();
    expect(axisFraction(20 * 60, 8, 20)).toBeNull();
    expect(axisFraction(600, 10, 10)).toBeNull();
  });
});
