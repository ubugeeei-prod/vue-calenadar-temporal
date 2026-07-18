import vize from "@vizejs/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [vize()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["vue", "temporal-polyfill-lite"],
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  lint: {
    ignorePatterns: ["dist/**"],
  },
  fmt: {
    trailingComma: "all",
    singleQuote: false,
    semi: true,
  },
});
