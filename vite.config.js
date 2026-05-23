import { defineConfig } from "vite";

// @tauri-apps/api@2 está instalado como dependencia real.
// NO se necesita alias — Vite lo resuelve desde node_modules.
// El stub solo se usa en modo browser puro (invoke falla silenciosamente via try/catch).

export default defineConfig({
  root: ".",
  base: "/",
  optimizeDeps: {
    // Excluir del pre-bundle de Vite dev — Tauri lo provee en runtime
    exclude: ["@tauri-apps/api"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Sin external — @tauri-apps/api se bundlea normalmente
  },
  server: {
    port: 1420,
    strictPort: false,
    open: true,
  },
});
