/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// `base` is host-aware: GitHub Pages project sites are served from /<repo>/,
// so the deploy workflow sets VITE_BASE. Local dev and root-domain hosts use "/".
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
});
