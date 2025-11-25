import { coverageConfigDefaults, defineConfig } from "vitest/config";

// @internal
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  test: {
    coverage: {
      all: false,
      exclude: ["src/utils/invariant.ts", ...coverageConfigDefaults.exclude],
    },
  },
});
