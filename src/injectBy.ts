import { inject } from "./inject";
import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects the instance associated with the given class.
 *
 * Throws an error if the class is not registered in the container.
 *
 * Compared to {@link inject}, `injectBy` accepts a `thisArg` argument
 * (e.g., the containing class instance) which is used to resolve circular dependencies.
 *
 * Example:
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
 * @param name - The name qualifier of the class to resolve.
 */
export function injectBy<Instance extends object>(thisArg: any, Class: Constructor<Instance>, name?: string): Instance;

/**
 * Injects the value associated with the given token.
 *
 * Throws an error if the token is not registered in the container.
 *
 * Compared to {@link inject}, `injectBy` accepts a `thisArg` argument
 * (e.g., the containing class instance) which is used to resolve circular dependencies.
 *
 * Example:
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
 * @param name - The name qualifier of the token to resolve.
 */
export function injectBy<Value>(thisArg: any, token: Token<Value>, name?: string): Value;

export function injectBy<T>(thisArg: any, token: Token<T>, name?: string): T {
  const context = ensureInjectionContext("injectBy()");
  const resolution = context.resolution;
  const currentFrame = resolution.stack.peek();

  if (!currentFrame) {
    return inject(token, name);
  }

  const cleanup = resolution.dependents.set(currentFrame.provider, { current: thisArg });

  try {
    return inject(token, name);
  } finally {
    cleanup();
  }
}
