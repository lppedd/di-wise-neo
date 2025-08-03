import type { Token } from "./token";

// @internal
export function assert(condition: unknown, message: string | (() => string)): asserts condition {
  if (!condition) {
    throw new Error(tag(typeof message === "string" ? message : message()));
  }
}

// @internal
export function expectNever(value: never): never {
  throw new TypeError(tag(`unexpected value ${String(value)}`));
}

// @internal
export function throwUnregisteredError(token: Token): never {
  throw new Error(tag(`unregistered token ${token.name}`));
}

// @internal
export function throwExistingUnregisteredError(sourceToken: Token, targetTokenOrError: Token | Error): never {
  let message = tag(`token resolution error encountered while resolving ${sourceToken.name}`);
  message += isError(targetTokenOrError)
    ? `\n  [cause] ${untag(targetTokenOrError.message)}`
    : `\n  [cause] the aliased token ${targetTokenOrError.name} is not registered`;
  throw new Error(message);
}

function isError(value: any): value is Error {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return value && value.stack && value.message && typeof value.message === "string";
}

function tag(message: string): string {
  return `[di-wise-neo] ${message}`;
}

function untag(message: string): string {
  return message.startsWith("[di-wise-neo]") ? message.substring(13).trimStart() : message;
}
