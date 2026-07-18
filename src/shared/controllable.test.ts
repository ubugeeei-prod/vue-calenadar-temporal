import { describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";
import { useControllableState } from "./controllable";

describe("useControllableState — uncontrolled", () => {
  it("owns its state when the source stays undefined", () => {
    const onUpdate = vi.fn();
    const { state, setState } = useControllableState<number>(
      () => undefined,
      1,
      onUpdate,
    );

    expect(state.value).toBe(1);
    setState(2);
    expect(state.value).toBe(2);
    expect(onUpdate).toHaveBeenCalledWith(2);
  });
});

describe("useControllableState — controlled", () => {
  it("mirrors the external source and only notifies on set", () => {
    const source = shallowRef<number | undefined>(10);
    const onUpdate = vi.fn();
    const { state, setState } = useControllableState<number>(
      source,
      1,
      onUpdate,
    );

    expect(state.value).toBe(10);
    setState(20);
    // The owner has not applied the update yet.
    expect(state.value).toBe(10);
    expect(onUpdate).toHaveBeenCalledWith(20);

    source.value = 20;
    expect(state.value).toBe(20);
  });

  it("falls back to internal state when the source turns undefined", () => {
    const source = shallowRef<string | undefined>("external");
    const { state, setState } = useControllableState<string>(source, "initial");

    expect(state.value).toBe("external");
    source.value = undefined;
    expect(state.value).toBe("initial");
    setState("internal");
    expect(state.value).toBe("internal");
  });
});
