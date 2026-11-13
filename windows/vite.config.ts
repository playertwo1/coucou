import { defineConfig, type Plugin } from "vite";
import { existsSync, mkdirSync, readdirSync, copyFileSync, createReadStream } from "node:fs";
import { dirname, resolve, join, extname } from "node:path";

// ───────────────────────────────────────────────────────────────────────────────
// THE one and only place the shared sound folder is declared.
// The 29 WAVs live in the macOS app and are NOT duplicated in the repo; when they
// move to `shared/sounds/`, change this single line.
export const SOUNDS_DIR = resolve(__dirname, "../NotchBuddy/Resources/sounds");
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Serves SOUNDS_DIR at /sounds/*.wav in dev, and copies it into dist/sounds on build.
 * Keeps the WAVs out of windows/ while still shipping them inside the installer.
 */
function sharedSounds(): Plugin {
  const prefix = "/sounds/";
  return {
    name: "coucou-shared-sounds",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(prefix)) return next();
        const name = decodeURIComponent(req.url.slice(prefix.length).split("?")[0]);
        if (name.includes("/") || name.includes("\\") || extname(name) !== ".wav") return next();
        const file = join(SOUNDS_DIR, name);
        if (!existsSync(file)) return next();
        res.setHeader("Content-Type", "audio/wav");
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      const out = resolve(__dirname, "dist/sounds");
      if (!existsSync(SOUNDS_DIR)) {
        this.warn(`sounds not found at ${SOUNDS_DIR} — the build will ship without audio`);
        return;
      }
      mkdirSync(out, { recursive: true });
      for (const f of readdirSync(SOUNDS_DIR)) {
        if (extname(f) === ".wav") copyFileSync(join(SOUNDS_DIR, f), join(out, f));
      }
    },
  };
}

export default defineConfig({
  define: { __LUMEN_WINDOWS__: JSON.stringify(process.platform === "win32") },
  plugins: [
    {
      name: "lumen-windows-sources",
      enforce: "pre",
      resolveId(source, importer) {
        if (process.platform !== "win32" || !importer) return null;
        const target = resolve(dirname(importer.split("?")[0]), source);
        if (target === resolve(__dirname, "src/mochi/engine")) return resolve(__dirname, "src/lumen/compass-engine.ts");
        if (target === resolve(__dirname, "src/mochi/greeting")) return resolve(__dirname, "src/lumen/greeting.ts");
        if (target === resolve(__dirname, "src/views/wardrobe")) return resolve(__dirname, "src/lumen/compass-details.ts");
        if (target === resolve(__dirname, "src/whats-new/whats-new.json")) return resolve(__dirname, "src/whats-new/lumen-whats-new.json");
        return null;
      },
      transformIndexHtml(html) {
        return process.platform === "win32" ? html.replace(/<title>.*?<\/title>/i, "<title>Lumen</title>") : html;
      },
    },
    ...(process.platform === "win32" ? [] : [sharedSounds()]),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
    // Cargo writes and locks files under target/ while Vite starts; watching them
    // crashes Vite on Windows with EBUSY. Tauri watches src-tauri/ itself.
    watch: { ignored: ["**/target/**", "**/src-tauri/**"] },
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  build: {
    target: "chrome110",
    minify: "esbuild",
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        island: resolve(__dirname, "index.html"),
        settings: resolve(__dirname, "settings.html"),
        ...(process.platform === "win32"
          ? { lumen: resolve(__dirname, "lumen.html") }
          : { mochi: resolve(__dirname, "mochi.html") }),
        pill: resolve(__dirname, "pill.html"),
      },
      output: {
        // The interface's strings in every language (src/i18n/*.json) make a
        // chunk of their own, kept apart from the code that changes more often.
        manualChunks: (id) => (/[\\/]src[\\/]i18n[\\/][^\\/]+\.json$/.test(id) ? "i18n" : undefined),
      },
    },
    // That chunk is about 0.8 MB and loaded from disk, never downloaded: the
    // default 500 kB warning is meant for web pages.
    chunkSizeWarningLimit: 1200,
  },
});
