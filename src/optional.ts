import { ensureInjectionContext } from "./injectionContext";
import type { Constructor, Token } from "./token";

/**
 * Injects the instance associated with the given class,
 * or `undefined` if the class is not registered in the container.
 */
export function optional<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance | undefined;

/**
 * Injects the value associated with the given token,
 * or `undefined` if the token is not registered in the container.
 */
export function optional<Value>(token: Token<Value>, name?: string): Value | undefined;

export function optional<T>(token: Token<T>, name?: string): T | undefined {
  const context = ensureInjectionContext(optional);
  return context.container.resolve(token, true, name);
}

/**
 * Injects the instance associated with the given class,
 * or `undefined` if the class is not registered in the container.
 *
 * Compared to {@link optional}, `optionalBy` accepts a `thisArg` argument
 * (the containing class) which is used to resolve circular dependencies.
 *
 * @param thisArg - The containing instance, used to help resolve circular dependencies.
 * @param Class - The class to resolve.
 * @param name - The name qualifier of the class to resolve.
 */
export function optionalBy<Instance extends object>(
  thisArg: any,
  Class: Constructor<Instance>,
  name?: string,
): Instance | undefined;

/**
 * Injects the value associated with the given token,
 * or `undefined` if the token is not registered in the container.
 *
 * Compared to {@link optional}, `optionalBy` accepts a `thisArg` argument
 * (the containing class) which is used to resolve circular dependencies.
 *
 * @param thisArg - The containing instance, used to help resolve circular dependencies.
 * @param token - The token to resolve.
 * @param name - The name qualifier of the token to resolve.
 */
export function optionalBy<Value>(thisArg: any, token: Token<Value>, name?: string): Value | undefined;

export function optionalBy<T>(thisArg: any, token: Token<T>, name?: string): T | undefined {
  const context = ensureInjectionContext(optionalBy);
  const resolution = context.resolution;
  const currentFrame = resolution.stack.peek();

  if (!currentFrame) {
    return optional(token, name);
  }

  const currentRef = { current: thisArg };
  const cleanup = resolution.dependents.set(currentFrame.provider, currentRef);

  try {
    return optional(token, name);
  } finally {
    cleanup();
  }
}
