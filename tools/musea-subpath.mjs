/**
 * Rebases the static Musea gallery onto a URL prefix.
 *
 * The gallery's prebuilt shell hardcodes absolute `/__musea__/…` URLs, which
 * only work at a domain root. gh-pages previews live under
 * `/<repo>/pr/<number>/`, so this script rewrites every `/__musea__`
 * occurrence in the emitted text files (html / js / css / json) to
 * `<prefix>/__musea__`.
 *
 * Run exactly once per fresh `vp run musea:build` output — the rewrite is
 * textual and intentionally not idempotent.
 *
 * @example
 * ```sh
 * node tools/musea-subpath.mjs /vue-calenadar-temporal/pr/25
 * ```
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const GALLERY_ROOT = path.resolve("dist-musea");

const REWRITABLE = new Set([".html", ".js", ".css", ".json"]);

const prefix = process.argv[2];

if (
  prefix === undefined ||
  !prefix.startsWith("/") ||
  prefix.endsWith("/") ||
  prefix === ""
) {
  console.error(
    "usage: node tools/musea-subpath.mjs </url/prefix> " +
      "(leading slash, no trailing slash)",
  );
  process.exit(1);
}

let rewrittenFiles = 0;

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await rewrite(entryPath);
      continue;
    }

    if (!REWRITABLE.has(path.extname(entry.name))) {
      continue;
    }

    const source = await readFile(entryPath, "utf8");

    if (!source.includes("/__musea__")) {
      continue;
    }

    await writeFile(
      entryPath,
      source.replaceAll("/__musea__", `${prefix}/__musea__`),
    );
    rewrittenFiles += 1;
  }
}

await rewrite(GALLERY_ROOT);
console.log(`[musea-subpath] rebased ${rewrittenFiles} file(s) onto ${prefix}`);
