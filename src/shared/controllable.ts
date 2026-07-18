/**
 * Controlled-first state, the pattern behind every `v-model` surface in the
 * library.
 *
 * A composable that owns its state can't be controlled from outside; one
 * that only mirrors props can't work standalone. `useControllableState`
 * does both: while the external source yields a defined value the caller
 * owns the state and updates only *notify*; when the source is `undefined`
 * an internal ref takes over and updates apply immediately.
 */
import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, shallowRef, toValue } from "vue";

// --- Types & Signatures ---

export type ControllableState<T> = {
  /** The effective value: the controlled source when defined, else internal. */
  readonly state: ComputedRef<T>;
  /**
   * Requests a change. Controlled: only `onUpdate` fires — the owner decides
   * whether to apply it. Uncontrolled: the internal ref updates *and*
   * `onUpdate` fires.
   */
  readonly setState: (value: T) => void;
};

// --- Implementation ---

/**
 * Creates a controlled-or-internal state cell.
 *
 * `shallowRef` is a requirement, not an optimization: deep reactivity would
 * wrap Temporal instances in proxies and break their internal-slot methods.
 *
 * @param source - External source of truth. Yield `undefined` to hand
 * control to the internal ref (and back, at any time).
 * @param initial - Internal starting value for the uncontrolled case.
 * @param onUpdate - Change notification; fires for every `setState` in both
 * modes.
 *
 * @example
 * ```ts
 * const open = useControllableState<boolean>(
 *   () => toValue(props.open),          // undefined → uncontrolled
 *   false,
 *   (value) => emit("update:open", value),
 * );
 *
 * open.state.value; // props-driven or internal
 * open.setState(true);
 * ```
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
    if (toValue(source) === undefined) {
      internal.value = value;
    }

    onUpdate?.(value);
  }

  return { state, setState };
}
