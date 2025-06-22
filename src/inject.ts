import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token, TokenList } from "./token";

/**
 * Inject an instance of a class.
 */
export function inject<Instance extends object>(Class: Constructor<Instance>): Instance;

/**
 * Inject an instance of a token.
 */
export function inject<Value>(token: Token<Value>): Value;

/**
 * Inject an instance of a token, by checking each token in order until a registered one is found.
 */
export function inject<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];

export function inject<T>(...tokens: Token<T>[]): T {
  const context = ensureInjectionContext(inject);
  return context.container.resolve(...tokens);
}

/**
 * Inject an instance of a class.
 *
 * @param thisArg - Used for resolving circular dependencies.
 * @param Class - TODO
 */
export function injectBy<Instance extends object>(
  thisArg: any,
  Class: Constructor<Instance>,
): Instance;

/**
 * Inject an instance of a token.
 *
 * @param thisArg - Used for resolving circular dependencies.
 * @param token - TODO
 */
export function injectBy<Value>(thisArg: any, token: Token<Value>): Value;

/**
 * Inject an instance of a token, by checking each token in order until a registered one is found.
 *
 * @param thisArg - Used for resolving circular dependencies.
 * @param tokens - TODO
 */
export function injectBy<Values extends unknown[]>(
  thisArg: any,
  ...tokens: TokenList<Values>
): Values[number];

export function injectBy<T>(thisArg: any, ...tokens: Token<T>[]): T {
  const context = ensureInjectionContext(injectBy);
  const resolution = context.resolution;
  const currentFrame = resolution.stack.peek();

  if (!currentFrame) {
    return inject(...tokens);
  }

  const currentRef = { current: thisArg };
  const cleanup = resolution.dependents.set(currentFrame.provider, currentRef);

  try {
    return inject(...tokens);
  } finally {
    cleanup();
  }
}

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
