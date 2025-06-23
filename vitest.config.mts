import { coverageConfigDefaults, defineConfig } from "vitest/config";

// @internal
export default defineConfig({
  test: {
    coverage: {
      all: false,
      exclude: ["src/utils/invariant.ts", ...coverageConfigDefaults.exclude],
    },
  },
});
