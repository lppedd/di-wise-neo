import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects the instance associated with the given class.
 *
 * Throws an error if:
 * - The class is not registered in the container.
 * - A circular dependency is detected. Use {@link injectBy} if resolving
 *   circular dependencies is necessary.
 */
export function inject<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance;

/**
 * Injects the value associated with the given token.
 *
 * Throws an error if:
 * - The token is not registered in the container.
 * - A circular dependency is detected. Use {@link injectBy} if resolving
 *   circular dependencies is necessary.
 */
export function inject<Value>(token: Token<Value>, name?: string): Value;

export function inject<T>(token: Token<T>, name?: string): T {
  const context = ensureInjectionContext("inject()");
  return context.container.resolve(token, name);
}
