import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token, TokenList } from "./token";

/**
 * Inject instances of a class with all registered providers.
 */
export function injectAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

/**
 * Inject instances of a token with all registered providers.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function injectAll<Value>(token: Token<Value>): NonNullable<Value>[];

/**
 * Inject instances of a token with all registered providers, by checking each token in order until a registered one is found.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function injectAll<Values extends unknown[]>(
  ...tokens: TokenList<Values>
): NonNullable<Values[number]>[];

export function injectAll<T>(...tokens: Token<T>[]): NonNullable<T>[] {
  const context = ensureInjectionContext(injectAll);
  return context.container.resolveAll(...tokens);
}
