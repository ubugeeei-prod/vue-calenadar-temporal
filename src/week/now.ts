import type { ShallowRef } from "vue";
import { onMounted, onUnmounted, shallowRef } from "vue";
import { Temporal } from "../temporal";

// --- Types & Signatures ---

export type NowIndicator = {
  /** Today in the display time zone; `null` until mounted (SSR-safe). */
  readonly today: Readonly<ShallowRef<Temporal.PlainDate | null>>;
  /**
   * Position of "now" on the axis as a fraction `[0, 1)`; `null` while
   * unmounted or outside the rendered hours.
   */
  readonly fraction: Readonly<ShallowRef<number | null>>;
};

export type UseNowIndicatorOptions = {
  readonly timeZone: () => string;
  readonly startHour?: () => number | undefined;
  readonly endHour?: () => number | undefined;
  /** Refresh interval in milliseconds. Default: 30 000. */
  readonly intervalMs?: number;
};

export type axisFraction = (
  minuteOfDay: number,
  startHour: number,
  endHour: number,
) => number | null;

// --- Implementation ---

/** Fraction of the `[startHour, endHour)` axis, or `null` outside it. */
export const axisFraction: axisFraction = (minuteOfDay, startHour, endHour) => {
  const start = startHour * 60;
  const end = endHour * 60;
  if (end <= start || minuteOfDay < start || minuteOfDay >= end) return null;
  return (minuteOfDay - start) / (end - start);
};

/**
 * Current-time indicator for the week view's time grid.
 *
 * Renders nothing on the server and during hydration: the clock only starts
 * in `onMounted`, so server and client markup always agree.
 */
export function useNowIndicator(options: UseNowIndicatorOptions): NowIndicator {
  const today = shallowRef<Temporal.PlainDate | null>(null);
  const fraction = shallowRef<number | null>(null);

  function update(): void {
    const now = Temporal.Now.zonedDateTimeISO(options.timeZone());
    today.value = now.toPlainDate();
    fraction.value = axisFraction(
      now.hour * 60 + now.minute,
      options.startHour?.() ?? 0,
      options.endHour?.() ?? 24,
    );
  }

  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    update();
    timer = setInterval(update, options.intervalMs ?? 30_000);
  });
  onUnmounted(() => {
    if (timer !== undefined) clearInterval(timer);
  });

  return { today, fraction };
}
