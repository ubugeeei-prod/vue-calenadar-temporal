/**
 * Post-processes the library build output.
 *
 * 1. Verifies `vize check src --declaration` actually produced the entry
 *    declarations (the emit step tolerates a known upstream failure, so
 *    missing output must fail the build here).
 * 2. Drops `*.test.d.ts` files from the package output.
 * 3. Overwrites the generic-SFC declarations with the hand-authored files in
 *    `types-overrides/` — `vize check --declaration` drops `generic` type
 *    parameters: https://github.com/ubugeeei-prod/vize/issues/3065
 * 4. Copies the opt-in stylesheets to `dist/styles/`.
 */
import { cp, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const TYPES_ROOT = path.resolve("dist/types/src");
const OVERRIDES_ROOT = path.resolve("types-overrides");
const STYLES_SOURCE = path.resolve("src/styles");
const STYLES_TARGET = path.resolve("dist/styles");

const REQUIRED = [
  "index.d.ts",
  "calendar/CalendarRoot.vue.d.ts",
  "date-picker/DatePickerRoot.vue.d.ts",
];

async function assertRequiredOutput() {
  for (const relative of REQUIRED) {
    const file = path.join(TYPES_ROOT, relative);
    try {
      await stat(file);
    } catch {
      console.error(`[finalize-build] missing declaration output: ${file}`);
      process.exit(1);
    }
  }
}

async function removeTestDeclarations(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeTestDeclarations(entryPath);
    } else if (entry.name.endsWith(".test.d.ts")) {
      await rm(entryPath);
    }
  }
}

async function copyStyles() {
  await cp(STYLES_SOURCE, STYLES_TARGET, { recursive: true });
  await rm(path.join(STYLES_TARGET, "styles.browser.test.ts"), {
    force: true,
  });
}

await assertRequiredOutput();
await removeTestDeclarations(TYPES_ROOT);
await cp(OVERRIDES_ROOT, TYPES_ROOT, { recursive: true });
await copyStyles();
console.log("[finalize-build] declarations and stylesheets finalized");
