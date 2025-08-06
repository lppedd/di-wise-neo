import type { Constructor, Token } from "../token";
import { forwardRef, isTokenRef, type TokenRef } from "../tokensRef";
import { checkNamedDecorator, checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects all instances provided by the registrations
 * associated with the given class.
 *
 * Throws an error if the class is not registered in the container.
 */
export function InjectAll<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token.
 *
 * Throws an error if the token is not registered in the container.
 */
export function InjectAll<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token.
 *
 * Allows referencing a token declared later in the file by using the
 * {@link forwardRef} helper function.
 *
 * Throws an error if the token is not registered in the container.
 *
 * @example
 * ```ts
 * class Wizard {
 *   constructor(@InjectAll(forwardRef(() => Wand)) readonly wands: Wand[]) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function InjectAll<Value>(tokens: TokenRef<Value>): ParameterDecorator;

export function InjectAll<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("InjectAll", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "InjectAll";
      dependency.tokenRef = isTokenRef(token) ? token : forwardRef(() => token);
      checkNamedDecorator(dependency, target, propertyKey, parameterIndex);
    });
  };
}
