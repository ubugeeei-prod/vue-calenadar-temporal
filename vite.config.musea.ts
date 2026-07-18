import vize from "@vizejs/vite-plugin";
import { musea } from "@vizejs/vite-plugin-musea";
import { defineConfig } from "vite-plus";

/**
 * Standalone config for the static Musea gallery (PR previews).
 * The library build lives in vite.config.ts; this one only exists for
 * `vp run musea:build`.
 */
export default defineConfig({
  // Relative asset URLs so the gallery works under any preview subpath
  // (gh-pages serves it at /<repo>/pr/<number>/).
  base: "./",
  plugins: [
    vize(),
    musea({
      previewCss: ["src/styles/style.css", "src/styles/musea-preview.css"],
      storybookOutDir: "dist-musea",
    }),
  ],
  build: {
    outDir: "dist-musea",
    // Keep `light-dark()` intact in the bundled preview CSS; the default
    // Lightning CSS minifier polyfills it destructively without targets.
    cssMinify: "esbuild",
  },
});
