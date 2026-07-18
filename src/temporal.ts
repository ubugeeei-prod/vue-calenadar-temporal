/**
 * Single boundary to the Temporal implementation.
 *
 * The library uses `temporal-polyfill-lite` as a ponyfill: no globals are
 * patched, and every module imports `Temporal` from here so the underlying
 * implementation stays swappable in one place.
 */
export { Temporal } from "temporal-polyfill-lite";
