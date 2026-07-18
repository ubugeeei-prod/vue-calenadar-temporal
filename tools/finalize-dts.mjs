/**
 * Post-processes the declaration output of `vize check src --declaration`.
 *
 * 1. Verifies the emit actually produced the entry declarations (the emit
 *    step tolerates a known upstream failure, so missing output must fail
 *    the build here).
 * 2. Drops `*.test.d.ts` files from the package output.
 * 3. Overwrites the generic-SFC declarations with the hand-authored files in
 *    `types-overrides/` — `vize check --declaration` drops `generic` type
 *    parameters: https://github.com/ubugeeei-prod/vize/issues/3065
 */
import { cp, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const TYPES_ROOT = path.resolve("dist/types/src");
const OVERRIDES_ROOT = path.resolve("types-overrides");

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
      console.error(`[finalize-dts] missing declaration output: ${file}`);
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

await assertRequiredOutput();
await removeTestDeclarations(TYPES_ROOT);
await cp(OVERRIDES_ROOT, TYPES_ROOT, { recursive: true });
console.log("[finalize-dts] declarations finalized");
