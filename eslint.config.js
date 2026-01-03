import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          // Allow numbers in template literals for better ergonomics
          // Example: `const msg = `Count: ${count}`;`
          // https://typescript-eslint.io/rules/restrict-template-expressions/
          allowNumber: true,
        },
      ],
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          // Allow conditions like `while (true)`
          // https://typescript-eslint.io/rules/no-unnecessary-condition
          allowConstantLoopConditions: true,
        },
      ],
      // https://typescript-eslint.io/rules/no-unnecessary-type-parameters/
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      // https://typescript-eslint.io/rules/no-confusing-void-expression/
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
);
