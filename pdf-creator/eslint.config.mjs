import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  { rules: { "jsx-a11y/alt-text": "off" } },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-JS/TS files that ESLint should never attempt to parse:
    ".dockerignore",
    "Dockerfile",
    "coverage/**",
  ]),
]);

export default eslintConfig;
