/**
 * Roving-tabindex focus for composite widgets (the WAI-ARIA grid pattern).
 *
 * A grid keeps exactly one cell in the tab order (`tabindex="0"`); arrow
 * keys move that "roving" spot. Moving it declaratively updates the
 * attribute, but real DOM focus must follow imperatively — there is no
 * Vue-level way to express "focus whatever just became tabbable". This
 * module is that one sanctioned imperative touch, funneled through a
 * template ref.
 */
import type { MaybeRefOrGetter } from "vue";
import { nextTick, toValue } from "vue";

// --- Types & Signatures ---

export type RovingFocus = {
  /** Moves DOM focus to the current roving-tabindex target after render. */
  readonly focusActive: () => Promise<void>;
};

// --- Implementation ---

/**
 * Creates the focus mover for a composite widget.
 *
 * `focusActive` waits one tick (so the new `tabindex="0"` is in the DOM),
 * then focuses that element. Call it only from event handlers — it touches
 * `document` focus, which does not exist during SSR.
 *
 * @param root - The widget's root element (usually a `useTemplateRef`).
 *
 * @example
 * ```ts
 * const root = useTemplateRef<HTMLElement>("root");
 * const roving = useRovingFocus(root);
 *
 * function onKeydown(event: KeyboardEvent): void {
 *   calendar.focusDate(nextDate);
 *   void roving.focusActive(); // DOM focus follows the moved tabindex
 * }
 * ```
 */
export function useRovingFocus(
  root: MaybeRefOrGetter<HTMLElement | null>,
): RovingFocus {
  async function focusActive(): Promise<void> {
    await nextTick();

    toValue(root)?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }

  return { focusActive };
}
