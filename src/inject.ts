import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token, TokenList, Tokens } from "./token";

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
export function inject<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): Values[number];

export function inject<T>(...tokens: Tokens<T>): T {
  const context = ensureInjectionContext(inject);
  return context.container.resolve(...tokens);
}

/**
 * Inject an instance of a class.
 *
 * @param thisArg - Used for resolving circular dependencies.
 * @param Class - The class to resolve.
 */
export function injectBy<Instance extends object>(
  thisArg: any,
  Class: Constructor<Instance>,
): Instance;

/**
 * Inject an instance of a token.
 *
 * @param thisArg - Used for resolving circular dependencies.
 * @param token - The token to resolve.
 */
export function injectBy<Value>(thisArg: any, token: Token<Value>): Value;

/**
 * Inject an instance of a token, by checking each token in order until a registered one is found.
 *
 * @param thisArg - Used for resolving circular dependencies.
 * @param tokens - The token to resolve. Each token is checked in order until a registered one is found.
 */
export function injectBy<Values extends [unknown, ...unknown[]]>(
  thisArg: any,
  ...tokens: TokenList<Values>
): Values[number];

export function injectBy<T>(thisArg: any, ...tokens: Tokens<T>): T {
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
