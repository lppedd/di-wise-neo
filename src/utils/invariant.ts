// @internal
export function invariant(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error("invariant violation");
  }
}
