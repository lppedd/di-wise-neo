import type { Constructor, Token } from "./token";
import type { MethodDependency } from "./tokenRegistry";

// @internal
export type TokenInfo = [Token, string?];

// @internal
export function check(condition: unknown, message: string | (() => string)): asserts condition {
  if (!condition) {
    throw new Error(tag(typeof message === "string" ? message : message()));
  }
}

// @internal
export function throwUnregisteredError(tokenInfo: TokenInfo): never {
  throw new Error(tag(`unregistered token ${getFullTokenName(tokenInfo)}`));
}

// @internal
export function throwTargetUnregisteredError(tokenInfo: TokenInfo, aliases: TokenInfo[]): never {
  const path = aliases.length > 0 ? ` (alias for ${getTokenPath(aliases)})` : "";
  const desc = getFullTokenName(tokenInfo) + path;
  const cause = `\n  [cause] useExisting points to unregistered token ${getFullTokenName(aliases.at(-1)!)}`;
  throw new Error(tag(`failed to resolve token ${desc}`) + cause);
}

// @internal
export function throwCircularAliasError(aliases: TokenInfo[]): never {
  const path = getTokenPath(aliases);
  throw new Error(tag(`circular alias detected: ${path}`));
}

// @internal
export function throwResolutionError(tokenInfo: TokenInfo, aliases: TokenInfo[], cause: any): never {
  const path = aliases.length > 0 ? ` (alias for ${getTokenPath(aliases)})` : "";
  const desc = getFullTokenName(tokenInfo) + path;
  throw new Error(tag(`failed to resolve token ${desc}`) + getCause(cause), { cause });
}

// @internal
export function throwParameterResolutionError(
  ctor: Constructor<any>,
  methodKey: string | symbol | undefined,
  dependency: MethodDependency,
  cause: any,
): never {
  const location = getLocation(ctor, methodKey);
  const tokenName = getFullTokenName([dependency.tokenRef!.getRefToken(), dependency.name]);
  const msg = tag(`failed to resolve dependency for ${location}(parameter #${dependency.index}: ${tokenName})`);
  throw new Error(msg + getCause(cause), { cause });
}

// @internal
export function getLocation(ctor: Constructor<any>, methodKey?: string | symbol): string {
  const ctorName = ctor.name || "<unnamed>";
  return methodKey ? `${ctorName}.${String(methodKey)}` : ctorName;
}

// @internal
export function getTokenPath(tokens: TokenInfo[]): string {
  return tokens.map(getFullTokenName).join(" \u2192 ");
}

// @internal
export function getFullTokenName(tokenInfo: TokenInfo): string {
  const [token, name] = tokenInfo;
  const tokenName = token.name || "<unnamed>";
  return name ? `${tokenName}["${name}"]` : tokenName;
}

// @internal
export function getTokenName(token: Token): string {
  return token.name || "<unnamed>";
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
