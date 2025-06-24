import type { Token } from "./token";

// @internal
export function assert(condition: unknown, message: string | (() => string)): asserts condition {
  if (!condition) {
    const resolvedMessage = typeof message === "string" ? message : message();
    throw new Error(tag(resolvedMessage));
  }
}

// @internal
export function expectNever(value: never): never {
  throw new TypeError(tag(`unexpected value ${String(value)}`));
}

// @internal
export function throwUnregisteredError(tokens: Token[]): never {
  const tokenNames = tokens.map((token) => token.name).join(", ");
  const suffix = tokenNames.length === 0 ? "no tokens received" : tokenNames;
  throw new Error(tag(`unregistered tokens: ${suffix}`));
}

// @internal
export function throwExistingUnregisteredError(
  sourceToken: Token,
  targetTokenOrError: Token | Error,
): never {
  let message = tag(`token resolution error encountered while resolving ${sourceToken.name}`);

  if (isError(targetTokenOrError)) {
    message += `\n  [cause] ${untag(targetTokenOrError.message)}`;
  } else {
    message += `\n  [cause] the aliased token ${targetTokenOrError.name} is not registered`;
  }

  throw new Error(message);
}

function isError(value: any): value is Error {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return value && value.stack && value.message && typeof value.message === "string";
}

function tag(message: string): string {
  return `[di-wise] ${message}`;
}

function untag(message: string): string {
  return message.startsWith("[di-wise]") //
    ? message.substring(9).trimStart()
    : message;
}
