import type { Token } from "./token";

// @internal
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(tag(message));
  }
}

// @internal
export function expectNever(value: never): never {
  throw new TypeError(tag(`unexpected value ${String(value)}`));
}

// @internal
export function throwNoTokensProvidedError(): never {
  throw new Error(tag(`at least one token must be provided for dependency resolution`));
}

// @internal
export function throwUnregisteredError(tokens: Token[]): never {
  const tokenNames = tokens.map((token) => token.name);
  throw new Error(tag(`unregistered token(s) ${tokenNames.join(", ")}`));
}

// @internal
export function throwExistingUnregisteredError(token: Token, cause: Error): never {
  let message = tag(`token resolution error encountered while resolving ${token.name}`);
  message += `\n  [cause] ${untag(cause.message)}`;
  throw new Error(message, { cause: cause });
}

function tag(message: string): string {
  return `[di-wise] ${message}`;
}

function untag(message: string): string {
  return message.startsWith("[di-wise]") //
    ? message.substring(9).trimStart()
    : message;
}
