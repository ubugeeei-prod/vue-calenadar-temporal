/**
 * The single boundary to the Temporal implementation.
 *
 * The library uses `temporal-polyfill-lite` as a **ponyfill**: no globals
 * are patched, and every module imports `Temporal` from here, keeping the
 * underlying implementation swappable in exactly one place.
 *
 * Two practical consequences:
 *
 * - **Deterministic behavior everywhere.** The ponyfill tracks the latest
 *   spec, so servers, browsers with native `Temporal`, and browsers without
 *   it all agree on results.
 * - **Foreign values still work.** If your app passes values created by
 *   another copy of the polyfill (or a native implementation), the event
 *   layer detects them structurally and rebuilds them via ISO strings —
 *   see `normalizeEvent`.
 *
 * @example
 * ```ts
 * import { Temporal } from "vue-calendar-temporal";
 *
 * const date = Temporal.PlainDate.from("2026-07-18");
 * date.add({ months: 1 }).toString(); // "2026-08-18"
 * ```
 */
export { Temporal } from "temporal-polyfill-lite";
