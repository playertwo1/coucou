import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "synthetic"),
  publicDir: false,
  build: { target: "chrome110", outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
