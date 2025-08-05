import type { Constructor, Token } from "./token";
import type { MethodDependency } from "./tokenRegistry";

// @internal
export function check(condition: unknown, message: string | (() => string)): asserts condition {
  if (!condition) {
    throw new Error(tag(typeof message === "string" ? message : message()));
  }
}

// @internal
export function expectNever(value: never): never {
  throw new TypeError(tag(`unexpected value ${String(value)}`));
}

// @internal
export function throwUnregisteredError(token: Token, name?: string): never {
  const spec = name !== undefined ? `[name=${name}]` : "";
  throw new Error(tag(`unregistered token ${getTokenName(token)}${spec}`));
}

// @internal
export function throwExistingUnregisteredError(token: Token, cause: Token | Error): never {
  const message = tag(`failed to resolve token ${getTokenName(token)}`);
  throw isError(cause)
    ? new Error(`${message}\n  [cause] ${untag(cause.message)}`, { cause })
    : new Error(`${message}\n  [cause] the aliased token ${getTokenName(cause)} is not registered`);
}

// @internal
export function throwParameterResolutionError(
  ctor: Constructor<any>,
  methodKey: string | symbol | undefined,
  dependency: MethodDependency,
  cause: Error,
): never {
  const location = getLocation(ctor, methodKey);
  const tokenName = getTokenName(dependency.tokenRef!.getRefToken());
  const message = tag(`failed to resolve dependency for ${location}(parameter #${dependency.index}: ${tokenName})`);
  throw new Error(`${message}\n  [cause] ${untag(cause.message)}`, { cause });
}

// @internal
export function getLocation(ctor: Constructor<any>, methodKey?: string | symbol): string {
  const ctorName = ctor.name || "<unnamed>";
  return methodKey ? `${ctorName}.${String(methodKey)}` : ctorName;
}

// @internal
export function getTokenName(token: Token): string {
  return token.name || "<unnamed>";
}

function isError(value: any): value is Error {
  return value && value.stack && value.message && typeof value.message === "string";
}

function tag(message: string): string {
  return `[di-wise-neo] ${message}`;
}

function untag(message: string): string {
  return message.startsWith("[di-wise-neo]") ? message.substring(13).trimStart() : message;
}
