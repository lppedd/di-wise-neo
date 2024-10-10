// @ts-check

/** @import { Linter } from 'eslint' */

import eslint from '@eslint/js'
import pluginStylistic from '@stylistic/eslint-plugin'
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    name: 'exuanbo/languages',
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
    name: 'exuanbo/ignores',
    ignores: ['.yarn', 'coverage', 'dist', 'docs'],
  },
  {
    name: 'exuanbo/files',
    files: ['**/*.?(c|m){j,t}s'],
  },
  {
    name: 'eslint/recommended',
    ...eslint.configs.recommended,
  },
  {
    name: 'exuanbo/typescript',
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-namespace': ['error', {
        allowDeclarations: true,
      }],
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    name: 'simple-import-sort',
    plugins: {
      'simple-import-sort': pluginSimpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    name: 'exuanbo/stylistic',
    plugins: {
      '@stylistic': pluginStylistic,
    },
    rules: extendRules(pluginStylistic.configs['recommended-flat'].rules, {
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/block-spacing': ['error', 'never'],
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 0,
      }],
      '@stylistic/object-curly-spacing': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', {
        avoidEscape: true,
        allowTemplateLiterals: true,
      }],
    }),
  },
)

/**
 * @param {Partial<Linter.RulesRecord> | undefined} rules
 * @param {Linter.RulesRecord} record
 * @returns {Partial<Linter.RulesRecord>}
 */
function extendRules(rules = {}, record) {
  return Object.entries(record).reduce(
    (extendedRules, [name, entry]) =>
      Object.assign(extendedRules, extendRule(name, entry)),
    rules,
  )

  /**
   * @param {string} name
   * @param {Linter.RuleEntry} entry
   * @returns {Linter.RulesRecord}
   */
  function extendRule(name, entry) {
    if (!Array.isArray(entry)) {
      return {[name]: entry}
    }
    const defaultEntry = rules[name]
    if (!Array.isArray(defaultEntry)) {
      return {[name]: entry}
    }
    const [, ...defaultOptions] = defaultEntry
    const [level, ...options] = entry
    const extendedOptions = options.map((option, i) => {
      if (typeof option !== 'object') {
        return option
      }
      const defaultOption = defaultOptions[i]
      if (typeof defaultOption !== 'object') {
        return option
      }
      return {
        ...defaultOption,
        ...option,
      }
    })
    return {[name]: [level, ...extendedOptions]}
  }
}
