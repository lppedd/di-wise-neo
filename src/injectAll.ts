import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects all instances provided by the registrations associated with the given class.
 *
 * Throws an error if the class is not registered in the container.
 */
export function injectAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

/**
 * Injects all values provided by the registrations associated with the given token.
 *
 * Throws an error if the token is not registered in the container.
 */
export function injectAll<Value>(token: Token<Value>): NonNullable<Value>[];

export function injectAll<T>(token: Token<T>): NonNullable<T>[] {
  const context = ensureInjectionContext(injectAll);
  return context.container.resolveAll(token);
}
