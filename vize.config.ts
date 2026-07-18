import { defineConfig } from "vize";

export default defineConfig({
  compiler: {
    sourceMap: true,
  },
  vite: {
    scanPatterns: ["src/**/*.vue"],
  },
  musea: {
    include: ["src/**/*.art.vue"],
    exclude: ["node_modules/**", "dist/**"],
    basePath: "/__musea__",
  },
  linter: {
    preset: "opinionated",
  },
  typeChecker: {
    enabled: true,
    strict: true,
  },
});
