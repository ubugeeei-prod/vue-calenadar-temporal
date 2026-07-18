import type { TextDirection } from "../i18n/locale";
import type { DayOfWeek } from "../shared/date";
import { endOfWeek, startOfWeek } from "../shared/date";
import type { Temporal } from "../temporal";

// --- Types & Signatures ---

/** What a key press means inside a date grid (WAI-ARIA APG grid pattern). */
export type GridKeyIntent =
  | { readonly kind: "move-days"; readonly days: number }
  | { readonly kind: "move-months"; readonly months: number }
  | { readonly kind: "move-years"; readonly years: number }
  | { readonly kind: "week-edge"; readonly edge: "start" | "end" }
  | { readonly kind: "select" };

/** Minimal key event shape so the resolver stays DOM-free and testable. */
export type GridKeyEventLike = {
  readonly key: string;
  readonly shiftKey?: boolean;
};

export type GridIntentEffect = {
  readonly focus?: Temporal.PlainDate;
  readonly select?: boolean;
};

export type resolveGridKey = (
  event: GridKeyEventLike,
  direction: TextDirection,
) => GridKeyIntent | undefined;

export type applyGridIntent = (
  intent: GridKeyIntent,
  focused: Temporal.PlainDate,
  firstDayOfWeek: DayOfWeek,
) => GridIntentEffect;

// --- Implementation ---

/**
 * Maps a key press to a grid intent. Horizontal arrows follow the visual
 * direction, so ArrowRight moves backwards in RTL locales.
 */
export const resolveGridKey: resolveGridKey = (event, direction) => {
  const rtl = direction === "rtl";
  switch (event.key) {
    case "ArrowRight":
      return { kind: "move-days", days: rtl ? -1 : 1 };
    case "ArrowLeft":
      return { kind: "move-days", days: rtl ? 1 : -1 };
    case "ArrowDown":
      return { kind: "move-days", days: 7 };
    case "ArrowUp":
      return { kind: "move-days", days: -7 };
    case "PageDown":
      return event.shiftKey === true
        ? { kind: "move-years", years: 1 }
        : { kind: "move-months", months: 1 };
    case "PageUp":
      return event.shiftKey === true
        ? { kind: "move-years", years: -1 }
        : { kind: "move-months", months: -1 };
    case "Home":
      return { kind: "week-edge", edge: "start" };
    case "End":
      return { kind: "week-edge", edge: "end" };
    case "Enter":
    case " ":
      return { kind: "select" };
    default:
      return undefined;
  }
};

/** Resolves an intent into the focus/select effect to apply. */
export const applyGridIntent: applyGridIntent = (intent, focused, firstDayOfWeek) => {
  switch (intent.kind) {
    case "move-days":
      return { focus: focused.add({ days: intent.days }) };
    case "move-months":
      return { focus: focused.add({ months: intent.months }) };
    case "move-years":
      return { focus: focused.add({ years: intent.years }) };
    case "week-edge":
      return {
        focus:
          intent.edge === "start"
            ? startOfWeek(focused, firstDayOfWeek)
            : endOfWeek(focused, firstDayOfWeek),
      };
    case "select":
      return { select: true };
  }
};
