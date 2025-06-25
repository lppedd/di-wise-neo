import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects the instance associated with the given class.
 *
 * Throws an error if the class is not registered in the container.
 */
export function inject<Instance extends object>(Class: Constructor<Instance>): Instance;

/**
 * Injects the value associated with the given token.
 *
 * Throws an error if the token is not registered in the container.
 */
export function inject<Value>(token: Token<Value>): Value;

export function inject<T>(token: Token<T>): T {
  const context = ensureInjectionContext(inject);
  return context.container.resolve(token);
}

/**
 * Injects the instance associated with the given class.
 *
 * Throws an error if the class is not registered in the container.
 *
 * Compared to {@link inject}, `injectBy` accepts a `thisArg` argument
 * (the containing class) which is used to resolve circular dependencies.
 *
 * @example
 * ```ts
 * class Wand {
 *   owner = inject(Wizard);
 * }
 *
 * class Wizard {
 *   wand = injectBy(this, Wand);
 * }
 * ```
 *
 * @param thisArg - The containing instance, used to help resolve circular dependencies.
 * @param Class - The class to resolve.
 */
export function injectBy<Instance extends object>(thisArg: any, Class: Constructor<Instance>): Instance;

/**
 * Injects the value associated with the given token.
 *
 * Throws an error if the token is not registered in the container.
 *
 * Compared to {@link inject}, `injectBy` accepts a `thisArg` argument
 * (the containing class) which is used to resolve circular dependencies.
 *
 * @example
 * ```ts
 * class Wand {
 *   owner = inject(Wizard);
 * }
 *
 * class Wizard {
 *   wand = injectBy(this, Wand);
 * }
 * ```
 *
 * @param thisArg - The containing instance, used to help resolve circular dependencies.
 * @param token - The token to resolve.
 */
export function injectBy<Value>(thisArg: any, token: Token<Value>): Value;

export function injectBy<T>(thisArg: any, token: Token<T>): T {
  const context = ensureInjectionContext(injectBy);
  const resolution = context.resolution;
  const currentFrame = resolution.stack.peek();

  if (!currentFrame) {
    return inject(token);
  }

  const currentRef = { current: thisArg };
  const cleanup = resolution.dependents.set(currentFrame.provider, currentRef);

  try {
    return inject(token);
  } finally {
    cleanup();
  }
}
