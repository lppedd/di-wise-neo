import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects all instances provided by the registrations associated with the given class
 * or an empty array if the class is not registered in the container.
 */
export function optionalAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

/**
 * Injects all values provided by the registrations associated with the given token
 * or an empty array if the token is not registered in the container.
 */
export function optionalAll<Value>(token: Token<Value>): Value[];

export function optionalAll<T>(token: Token<T>): T[] {
  const context = ensureInjectionContext("optionalAll()");
  return context.container.resolveAll(token, true);
}
