/**
 * Cuts a release without ever pushing to `main` directly.
 *
 * `main` only accepts squash-merged pull requests with green checks, so the
 * version bump itself must ride a PR. This script automates the whole ride:
 *
 * 1. Preflight — clean tree, on `main`, up to date with `origin/main`.
 * 2. Bump `package.json` on a `release/vX.Y.Z` branch and push it.
 * 3. Open the release PR and enable auto-merge (squash).
 * 4. Wait for the required `ci` gate to merge it.
 * 5. Tag the merged commit `vX.Y.Z` and push the tag.
 *
 * The tag push triggers `.github/workflows/release.yml`, which builds and
 * publishes to npm via OIDC trusted publishing and creates the GitHub
 * Release.
 *
 * @example
 * ```sh
 * vp run release minor   # 0.1.0 → 0.2.0
 * vp run release patch   # 0.1.0 → 0.1.1
 * vp run release major   # 0.1.0 → 1.0.0
 * ```
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const LEVELS = new Set(["patch", "minor", "major"]);

const MERGE_POLL_INTERVAL_MS = 10_000;
const MERGE_POLL_ATTEMPTS = 60;

/** Runs a command, streaming output; throws on a non-zero exit. */
const run = (command, args) => {
  execFileSync(command, args, { stdio: "inherit" });
};

/** Runs a command and returns its trimmed stdout; throws on failure. */
const capture = (command, args) =>
  execFileSync(command, args, { encoding: "utf8" }).trim();

const fail = (message) => {
  console.error(`\n[release] ${message}`);
  process.exit(1);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- 0. Arguments ----------------------------------------------------------

const level = process.argv[2];

if (level === undefined || !LEVELS.has(level)) {
  fail(
    `usage: vp run release <patch|minor|major> (got: ${level ?? "nothing"})`,
  );
}

// --- 1. Preflight ----------------------------------------------------------

if (capture("git", ["status", "--porcelain"]) !== "") {
  fail("working tree is dirty — commit or stash first.");
}

if (capture("git", ["branch", "--show-current"]) !== "main") {
  fail("releases start from main — switch branches first.");
}

run("git", ["fetch", "origin", "main"]);

if (
  capture("git", ["rev-parse", "HEAD"]) !==
  capture("git", ["rev-parse", "origin/main"])
) {
  fail("main is not in sync with origin/main — pull or push first.");
}

// --- 2. Version bump on a release branch -----------------------------------

const currentVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const [major = 0, minor = 0, patch = 0] = currentVersion
  .split(".")
  .map((part) => Number.parseInt(part, 10));

const nextVersion =
  level === "major"
    ? `${major + 1}.0.0`
    : level === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

const tag = `v${nextVersion}`;
const branch = `release/${tag}`;

console.log(`\n[release] ${currentVersion} → ${nextVersion} (${level})\n`);

run("git", ["checkout", "-b", branch]);
run("npm", ["pkg", "set", `version=${nextVersion}`]);
run("git", ["add", "package.json"]);
run("git", ["commit", "-m", `release: ${tag}`]);
run("git", ["push", "-u", "origin", branch]);

// --- 3. Release PR with auto-merge -----------------------------------------

run("gh", [
  "pr",
  "create",
  "--title",
  `release: ${tag}`,
  "--body",
  `Version bump for the ${tag} release. Merging tags the commit and triggers the npm publish workflow.`,
]);
run("gh", ["pr", "merge", "--auto", "--squash"]);

// --- 4. Wait for the gate --------------------------------------------------

let merged = false;

for (let attempt = 0; attempt < MERGE_POLL_ATTEMPTS; attempt += 1) {
  await sleep(MERGE_POLL_INTERVAL_MS);
  const state = capture("gh", [
    "pr",
    "view",
    branch,
    "--json",
    "state",
    "--jq",
    ".state",
  ]);
  console.log(`[release] PR state: ${state}`);
  if (state === "MERGED") {
    merged = true;
    break;
  }
  if (state === "CLOSED") fail("release PR was closed without merging.");
}

if (!merged) fail("timed out waiting for the release PR to merge.");

// --- 5. Tag the merged commit ----------------------------------------------

run("git", ["checkout", "main"]);
run("git", ["pull", "--ff-only", "origin", "main"]);

const landedVersion = JSON.parse(readFileSync("package.json", "utf8")).version;

if (landedVersion !== nextVersion) {
  fail(`main has version ${landedVersion}, expected ${nextVersion}.`);
}

run("git", ["tag", tag]);
run("git", ["push", "origin", tag]);

console.log(
  `\n[release] ${tag} tagged — the Release workflow takes it from here:`,
);
console.log(
  "          https://github.com/ubugeeei-prod/vue-calenadar-temporal/actions/workflows/release.yml\n",
);
