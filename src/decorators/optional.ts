import type { Constructor, Token } from "../token";
import { forwardRef, isTokenRef, type TokenRef } from "../tokensRef";
import { checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects the instance associated with the given class,
 * or `undefined` if the class is not registered in the container.
 */
export function Optional<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects the value associated with the given token,
 * or `undefined` if the token is not registered in the container.
 */
export function Optional<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects the value associated with the given token,
 * or `undefined` if the token is not registered in the container.
 *
 * Allows referencing a token declared later in the file by using the
 * {@link forwardRef} helper function.
 *
 * @example
 * ```ts
 * class Wizard {
 *   constructor(@Optional(forwardRef(() => Wand)) readonly wand: Wand | undefined) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function Optional<Value>(tokens: TokenRef<Value>): ParameterDecorator;

export function Optional<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("Optional", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "Optional";
      dependency.tokenRef = isTokenRef(token) ? token : forwardRef(() => token);
    });
  };
}
