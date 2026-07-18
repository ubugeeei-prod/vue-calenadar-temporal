import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, shallowRef, toValue } from "vue";

// --- Types & Signatures ---

export type ControllableState<T> = {
  readonly state: ComputedRef<T>;
  readonly setState: (value: T) => void;
};

// --- Implementation ---

/**
 * Controlled-first state: while `source` yields a defined value the caller
 * owns the state and `setState` only notifies `onUpdate`; when `source` is
 * `undefined` an internal ref takes over so the same composable also works
 * standalone.
 *
 * `shallowRef` is required, not an optimization: deep reactivity would wrap
 * Temporal instances in proxies and break their internal-slot methods.
 */
export function useControllableState<T>(
  source: MaybeRefOrGetter<T | undefined>,
  initial: T,
  onUpdate?: (value: T) => void,
): ControllableState<T> {
  const internal = shallowRef(initial);

  const state = computed(() => {
    const controlled = toValue(source);
    return controlled === undefined ? internal.value : controlled;
  });

  function setState(value: T): void {
    if (toValue(source) === undefined) internal.value = value;
    onUpdate?.(value);
  }

  return { state, setState };
}
