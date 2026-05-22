import tseslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs["recommended"].rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
]
