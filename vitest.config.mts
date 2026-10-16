import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    // Zona horaria de los usuarios, igual en local y en Jenkins: detecta fechas corridas por UTC.
    env: { TZ: "America/Santiago" },
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
