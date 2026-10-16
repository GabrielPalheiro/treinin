import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // domain/ é código puro: não conhece React, Next, Supabase nem o resto do app.
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*", "next", "next/*"],
              message: "domain/ não importa React nem Next.",
            },
            {
              group: ["@supabase/*"],
              message: "domain/ não importa Supabase.",
            },
            {
              group: ["@/*", "!@/domain", "!@/domain/**"],
              message: "domain/ só importa de domain/.",
            },
            {
              group: ["**/app", "**/app/**", "**/features", "**/features/**", "**/lib", "**/lib/**", "**/components", "**/components/**"],
              message: "domain/ só importa de domain/.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
