import { playwright } from "@vitest/browser-playwright";
import vize from "@vizejs/vite-plugin";
import { musea } from "@vizejs/vite-plugin-musea";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    vize(),
    // Component gallery at /__musea__ — dev server only, so the library
    // build stays untouched.
    { ...musea({ previewCss: ["src/styles/style.css"] }), apply: "serve" },
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue", "temporal-polyfill-lite"],
      output: {
        // One output module per source module: consumers' bundlers can
        // tree-shake at file granularity (a DatePicker-only app never pays
        // for the week view).
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.browser.test.ts"],
        },
      },
      {
        extends: true,
        // Keep a single copy of Vue in the browser client: pre-bundled and
        // raw ESM copies would break identity checks (e.g. EMPTY_OBJ in
        // useTemplateRef).
        optimizeDeps: {
          exclude: [
            "vue",
            "@vue/runtime-dom",
            "@vue/runtime-core",
            "@vue/reactivity",
            "@vue/shared",
            "@vue/server-renderer",
            "@vue/compiler-dom",
            "@vue/compiler-core",
            "@vue/compiler-ssr",
            "@vue/compiler-sfc",
            "vitest-browser-vue",
          ],
        },
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
  lint: {
    ignorePatterns: ["dist/**"],
  },
  fmt: {
    printWidth: 80,
    trailingComma: "all",
    singleQuote: false,
    semi: true,
  },
  run: {
    tasks: {
      lint: {
        command: "vize lint src",
      },
      typecheck: {
        command: "vize check src",
      },
      build: {
        // The declaration step tolerates a known upstream failure on generic
        // SFCs (https://github.com/ubugeeei-prod/vize/issues/3065);
        // finalize-dts.mjs asserts the output and patches those two files.
        command:
          "vp build && (vize check src --declaration || true) && node tools/finalize-build.mjs",
      },
      "musea:build": {
        command: "vp build --config vite.config.musea.ts",
      },
      vrt: {
        // Needs a running dev server: `vp dev` in another shell first.
        command:
          "vp exec musea-vrt --ci --a11y --base-url http://localhost:5173",
      },
      "vrt:update": {
        command: "vp exec musea-vrt --update --base-url http://localhost:5173",
      },
      size: {
        command: "vp run build && vp exec size-limit",
      },
      release: {
        // `vp run release minor` — see tools/release.mjs for the full flow.
        command: "node tools/release.mjs",
      },
      ready: {
        command:
          "vp fmt && vp check && vp run lint && vp run typecheck && vp test run && vp run build",
      },
    },
  },
});
