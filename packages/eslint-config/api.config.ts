import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export const apiConfig = [
  {
    files: ["**/*.{ts}"],
    plugins: {
      js
    },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node
    }
  },
  tseslint.configs.recommended,
];
