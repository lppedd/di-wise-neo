// @ts-check

import eslint from "@eslint/js";
import pluginStylistic from "@stylistic/eslint-plugin";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    name: "exuanbo/languages",
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
    },
  },
  {
    name: "exuanbo/ignores",
    ignores: [".yarn", "coverage", "dist", "docs"],
  },
  {
    name: "exuanbo/files",
    files: ["**/*.?(c|m){j,t}s"],
  },
  {
    name: "exuanbo/eslint",
    extends: [
      {
        name: "eslint/recommended",
        ...eslint.configs.recommended,
      },
    ],
    rules: {
      "no-param-reassign": "error",
    },
  },
  {
    name: "exuanbo/typescript",
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": ["error", {
        fixStyle: "inline-type-imports",
      }],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-unused-expressions": ["error", {
        allowShortCircuit: true,
      }],
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
    },
  },
  {
    name: "simple-import-sort/all",
    plugins: {
      "simple-import-sort": pluginSimpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    name: "exuanbo/stylistic",
    extends: [
      {
        name: "stylistic/recommended",
        ...pluginStylistic.configs.customize({
          flat: true,
          arrowParens: true,
          blockSpacing: false,
          jsx: false,
          quotes: "double",
          semi: true,
        }),
      },
    ],
    rules: {
      "@stylistic/object-curly-spacing": ["error", "never"],
    },
  },
);
