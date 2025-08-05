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
  throw new Error(tag(`unregistered token ${getTokenName(token, name)}`));
}

// @internal
export function throwResolutionError(token: Token, aliases: Token[], cause: any, name?: string): never {
  const path = aliases.length > 0 ? ` (alias for ${getTokenPath(aliases)})` : "";
  const description = getTokenName(token, name) + path;
  throw new Error(tag(`failed to resolve token ${description}`) + getCause(cause), { cause });
}

// @internal
export function throwExistingUnregisteredError(token: Token, aliases: Token[], name?: string): never {
  const path = aliases.length > 0 ? ` (alias for ${getTokenPath(aliases)})` : "";
  const description = getTokenName(token, name) + path;
  const cause = `\n  [cause] useExisting points to unregistered token ${getTokenName(aliases.at(-1)!)}`;
  throw new Error(tag(`failed to resolve token ${description}`) + cause);
}

// @internal
export function throwParameterResolutionError(
  ctor: Constructor<any>,
  methodKey: string | symbol | undefined,
  dependency: MethodDependency,
  cause: any,
): never {
  const location = getLocation(ctor, methodKey);
  const tokenName = getTokenName(dependency.tokenRef!.getRefToken(), dependency.name);
  const msg = tag(`failed to resolve dependency for ${location}(parameter #${dependency.index}: ${tokenName})`);
  throw new Error(msg + getCause(cause), { cause });
}

// @internal
export function getLocation(ctor: Constructor<any>, methodKey?: string | symbol): string {
  const ctorName = ctor.name || "<unnamed>";
  return methodKey ? `${ctorName}.${String(methodKey)}` : ctorName;
}

// @internal
export function getTokenName(token: Token, name?: string): string {
  const tokenName = token.name || "<unnamed>";
  return name ? `${tokenName}[name=${name}]` : tokenName;
}

// @internal
export function getTokenPath(tokens: Token[]): string {
  return tokens.map((t) => getTokenName(t)).join(" \u2192 ");
}

function getCause(error: any): string {
  if (!error) {
    return "";
  }

  const msg = isError(error) ? error.message : String(error);
  return `\n  [cause] ${untag(msg)}`;
}

function isError(value: any): value is Error {
  return value?.stack && typeof value?.message === "string";
}

function tag(message: string): string {
  return `[di-wise-neo] ${message}`;
}

function untag(message: string): string {
  return message.startsWith("[di-wise-neo]") ? message.substring(13).trimStart() : message;
}
