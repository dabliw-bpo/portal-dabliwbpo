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
    // Obsidian vault: bundled third-party plugin code (main.js is a ~3MB
    // bundle that exhausts ESLint's heap).
    ".obsidian/**",
    // Self-contained squad with its own package.json and tooling; it does
    // not touch this app's src/.
    "financial-analysis/**",
  ]),
]);

export default eslintConfig;
