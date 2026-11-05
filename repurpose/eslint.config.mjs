import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  // 1. Next.js presets (React, hooks, a11y, Core Web Vitals, TypeScript)
  ...nextVitals,
  ...nextTs,

  // 2. Files ESLint should never look at
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/db/migrations/**"]),

  // 3. Project rules — applies to ALL .ts/.tsx files (mirrors AGENTS.md)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Rule 9: env is read only in lib/env.ts
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Read env via `@/lib/env` only.",
        },
      ],

      // Do NOT ship console.log — use lib/logger
      "no-console": ["error", { allow: ["warn", "error"] }],

      // Rule 1: no any, no ts-ignore
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],

      // Cleaner imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // 4. EXCEPTIONS — the object I was referring to.
  //    These files are allowed to read process.env and use console,
  //    because that is literally their job.
  {
    files: [
      "src/lib/env.ts",
      "src/lib/logger.ts",
      "next.config.ts",
      "drizzle.config.ts",
      "vitest.config.ts",
      "vitest.config.mts",
      "playwright.config.ts",
    ],
    rules: {
      "no-restricted-properties": "off",
      "no-console": "off",
    },
  },
]);
