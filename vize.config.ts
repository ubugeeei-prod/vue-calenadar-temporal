import { defineConfig } from "vize";

export default defineConfig({
  compiler: {
    sourceMap: true,
  },
  vite: {
    scanPatterns: ["src/**/*.vue"],
  },
  linter: {
    preset: "opinionated",
  },
  typeChecker: {
    enabled: true,
    strict: true,
  },
});
