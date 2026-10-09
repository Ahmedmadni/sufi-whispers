/**
 * Standalone SPA bundle for Capacitor. Deliberately does NOT use the
 * Lovable/TanStack Start SSR + Cloudflare Vite configuration.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve("mobile"),
  publicDir: resolve("mobile/.public"),
  plugins: [
    // Rebuild the route tree from src/routes for standalone Android output.
    // This plugin must precede React in the Vite plugin chain.
    tanstackRouter({
      target: "react",
      routesDirectory: resolve("src/routes"),
      generatedRouteTree: resolve("src/routeTree.gen.ts"),
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": resolve("src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  // Keep web SSR output independent from the Capacitor client-only assets.
  define: { "import.meta.env.VITE_MOBILE": JSON.stringify("true") },
  server: {
    fs: { allow: [resolve(".")] },
  },
  build: {
    outDir: resolve("dist-mobile"),
    emptyOutDir: true,
    target: "es2022",
  },
});
