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
          "vp build && (vize check src --declaration || true) && node tools/finalize-dts.mjs",
      },
      ready: {
        command:
          "vp fmt && vp check && vp run lint && vp run typecheck && vp test run && vp run build",
      },
    },
  },
});
