import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reportes de Playwright:
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn"
    },
  },
  {
    // Pruebas E2E: no son componentes React (el `use` de los fixtures de Playwright
    // no es un hook) y el backend simulado informa su puerto por consola.
    files: ["e2e/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
