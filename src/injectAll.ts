import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token, TokenList, Tokens } from "./token";

/**
 * Inject instances of a class with all registered providers.
 */
export function injectAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

/**
 * Inject the values of a token from all its registered providers.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function injectAll<Value>(token: Token<Value>): NonNullable<Value>[];

/**
 * Inject the values of a token from all its registered providers,
 * by checking each token in order until a registered one is found.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function injectAll<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): NonNullable<Values[number]>[];

export function injectAll<T>(...tokens: Tokens<T>): NonNullable<T>[] {
  const context = ensureInjectionContext(injectAll);
  return context.container.resolveAll(...tokens);
}
