import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects the instance associated with the given class,
 * or `undefined` if the class is not registered in the container.
 *
 * Throws an error if a circular dependency is detected.
 * Use {@link optionalBy} if resolving circular dependencies is necessary.
 */
export function optional<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance | undefined;

/**
 * Injects the value associated with the given token,
 * or `undefined` if the token is not registered in the container.
 *
 * Throws an error if a circular dependency is detected.
 * Use {@link optionalBy} if resolving circular dependencies is necessary.
 */
export function optional<Value>(token: Token<Value>, name?: string): Value | undefined;

export function optional<T>(token: Token<T>, name?: string): T | undefined {
  const context = ensureInjectionContext("optional()");
  return context.container.tryResolve(token, name);
}
