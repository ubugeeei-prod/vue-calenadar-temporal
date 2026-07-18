import { playwright } from "@vitest/browser-playwright";
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
