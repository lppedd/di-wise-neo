import { type Constructor, isConstructor, type Token } from "./token";
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
  throw new Error(tag(`unregistered ${describeToken(token)}${spec}`));
}

// @internal
export function throwExistingUnregisteredError(token: Token, cause: Token | Error): never {
  const message = tag(`error while resolving ${describeToken(token)}`);
  throw isError(cause)
    ? new Error(`${message}\n  [cause] ${untag(cause.message)}`, { cause })
    : new Error(`${message}\n  [cause] the aliased ${describeToken(cause)} is not registered`);
}

// @internal
export function throwParameterResolutionError(
  ctor: Constructor<any>,
  method: string | symbol | undefined,
  dependency: MethodDependency,
  cause: Error,
): never {
  const location = method === undefined ? ctor.name : `${ctor.name}.${String(method)}`;
  const token = dependency.tokenRef!.getRefToken();
  const message = tag(`failed to resolve dependency at ${location}(parameter #${dependency.index}: ${token.name})`);
  throw new Error(`${message}\n  [cause] ${untag(cause.message)}`, { cause });
}

function describeToken(token: Token): string {
  return `${isConstructor(token) ? "class" : "token"} ${token.name}`;
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
