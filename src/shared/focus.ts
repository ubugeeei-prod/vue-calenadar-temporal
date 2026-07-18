import type { MaybeRefOrGetter } from "vue";
import { nextTick, toValue } from "vue";

// --- Types & Signatures ---

export type RovingFocus = {
  /** Moves DOM focus to the current roving-tabindex target after render. */
  readonly focusActive: () => Promise<void>;
};

// --- Implementation ---

/**
 * Roving-tabindex focus for composite widgets (ARIA grid pattern).
 *
 * Keyboard navigation must move real DOM focus to the newly active cell;
 * there is no declarative Vue-level way to express that, so this is the one
 * sanctioned imperative DOM touch, funneled through a template ref. Only
 * call it from event handlers — it is a no-op concern on the server.
 */
export function useRovingFocus(root: MaybeRefOrGetter<HTMLElement | null>): RovingFocus {
  async function focusActive(): Promise<void> {
    await nextTick();
    toValue(root)?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }

  return { focusActive };
}
