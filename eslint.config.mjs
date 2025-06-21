// @ts-check

import eslint from "@eslint/js";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    name: "exuanbo/languages",
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.es2022,
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
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-namespace": [
        "error",
        {
          allowDeclarations: true,
        },
      ],
      // HACK: https://github.com/jsr-io/jsr/issues/780
      "@typescript-eslint/no-unnecessary-type-assertion": [
        "error",
        {
          typesToIgnore: ["Type<null>", "Type<undefined>"],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "no-var": "off",
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
);
