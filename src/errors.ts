export const ErrorMessage = {
  ReservedToken: "reserved token",
  UnresolvableToken: "unresolvable token",
  CircularDependency: "circular dependency",
  InjectOutsideOfContext: "inject outside of context",
} as const;

// @internal
export function assert(condition: unknown, ...args: any[]): asserts condition {
  if (!condition) {
    throw new Error(args.join(" "));
  }
}

// @internal
export function expectNever(value: never): never {
  throw new TypeError("unexpected value: " + value);
}
