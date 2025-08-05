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
export function throwExistingUnregisteredError(token: Token, existingToken: Token): never {
  const msg = tag(`failed to resolve alias token ${getTokenName(token)}`);
  throw new Error(`${msg}\n  [cause] useExisting points to unregistered token ${getTokenName(existingToken)}`);
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
  const msg = tag(`failed to resolve dependency for ${location}(parameter #${dependency.index}: ${tokenName})`);
  throw new Error(`${msg}\n  [cause] ${untag(cause.message)}`, { cause });
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

function tag(message: string): string {
  return `[di-wise-neo] ${message}`;
}

function untag(message: string): string {
  return message.startsWith("[di-wise-neo]") ? message.substring(13).trimStart() : message;
}
