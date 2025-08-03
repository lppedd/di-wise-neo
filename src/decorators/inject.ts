import type { Constructor, Token } from "../token";
import { forwardRef, isTokenRef, type TokenRef } from "../tokensRef";
import { checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects the instance associated with the given class.
 *
 * Throws an error if the class is not registered in the container.
 */
export function Inject<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects the value associated with the given token.
 *
 * Throws an error if the token is not registered in the container.
 */
export function Inject<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects the value associated with the given token.
 *
 * Allows referencing a token that is declared later in the file by using
 * the {@link forwardRef} helper function.
 *
 * Throws an error if the token is not registered in the container.
 *
 * @example
 * ```ts
 * class Wizard {
 *   constructor(@Inject(forwardRef(() => Wand)) readonly wand: Wand) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function Inject<Value>(tokens: TokenRef<Value>): ParameterDecorator;

export function Inject<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("Inject", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "Inject";
      dependency.tokenRef = isTokenRef(token) ? token : forwardRef(() => token);
    });
  };
}
