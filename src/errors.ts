// @internal
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// @internal
export function expectNever(value: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new TypeError(`unexpected value ${value}`);
}
