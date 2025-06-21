import type { Token } from "./token";

// @internal
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[di-wise] ${message}`);
  }
}

// @internal
export function expectNever(value: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new TypeError(`unexpected value ${value}`);
}

// @internal
export function throwUnregisteredError(tokens: Token[]): never {
  const tokenNames = tokens.map((token) => token.name);
  assert(false, `unregistered token(s) ${tokenNames.join(", ")}`);
}
