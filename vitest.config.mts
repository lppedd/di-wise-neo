import { defineConfig } from "vitest/config";

// @internal
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  test: {
    coverage: {
      include: ["src/**"],
    },
  },
});
