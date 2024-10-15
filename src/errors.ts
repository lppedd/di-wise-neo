export const ErrorMessage = {
  ReservedToken: "reserved token",
  UnresolvableToken: "unresolvable token",
  CircularDependency: "circular dependency",
  InvariantViolation: "invariant violation",
  InjectOutsideOfContext: "inject outside of context",
} as const;

// @internal
export function assert(condition: unknown, ...args: any[]): asserts condition {
  if (!condition) {
    const formatter = new Intl.ListFormat("en", {style: "narrow", type: "unit"});
    throw new Error(formatter.format(args));
  }
}

// @internal
export function expectNever(value: never): never {
  throw new TypeError("unexpected value: " + value);
}
