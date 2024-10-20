export const ErrorMessage = {
  ReservedToken: "reserved token",
  UnregisteredToken: "unregistered token",
  CircularDependency: "circular dependency",
  MissingInjectionContext: "missing injection context",
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
