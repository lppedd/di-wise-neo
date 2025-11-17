import type { Constructor, Token } from "../token";
import { isTokenRef, type TokenRef, tokenRef } from "../tokenRef";
import { checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects the instance associated with the given class.
 *
 * Throws an error if:
 * - The class is not registered in the container.
 * - A circular dependency is detected. Use function injection with {@link injectBy}
 *   if resolving circular dependencies is necessary.
 */
export function Inject<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects the value associated with the given token.
 *
 * Throws an error if:
 * - The token is not registered in the container.
 * - A circular dependency is detected. Use function injection with {@link injectBy}
 *   if resolving circular dependencies is necessary.
 */
export function Inject<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects the value associated with the given token.
 *
 * Allows referencing a token declared later in the file by using the
 * {@link tokenRef} helper function.
 *
 * Throws an error if:
 * - The token is not registered in the container.
 * - A circular dependency is detected. Use function injection with {@link injectBy}
 *   if resolving circular dependencies is necessary.
 *
 * @example
 * ```ts
 * class Wizard {
 *   constructor(@Inject(tokenRef(() => Wand)) readonly wand: Wand) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function Inject<Value>(tokens: TokenRef<Value>): ParameterDecorator;

// @__NO_SIDE_EFFECTS__
export function Inject<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("Inject", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "Inject";
      dependency.tokenRef = isTokenRef(token) ? token : tokenRef(() => token);
    });
  };
}
