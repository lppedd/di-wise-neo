import type { Constructor, Token } from "../token";
import { isTokenRef, type TokenRef, tokenRef } from "../tokenRef";
import type { ParameterDecorator } from "./decorators";
import { checkNamedDecorator, checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects all instances provided by the registrations
 * associated with the given class or an empty array if the class is not registered
 * in the container.
 *
 * Throws an error if a circular dependency is detected.
 */
export function OptionalAll<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token or an empty array if the token is not registered
 * in the container.
 *
 * Throws an error if a circular dependency is detected.
 */
export function OptionalAll<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token or an empty array if the token is not registered
 * in the container.
 *
 * This overload allows referencing a token declared later in the file by using
 * the {@link tokenRef} helper function.
 *
 * Throws an error if a circular dependency is detected.
 *
 * Example:
 * ```ts
 * class Wizard {
 *   constructor(@OptionalAll(tokenRef(() => Wand)) readonly wands: Wand[]) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function OptionalAll<Value>(tokens: TokenRef<Value>): ParameterDecorator;

// @__NO_SIDE_EFFECTS__
export function OptionalAll<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("OptionalAll", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "OptionalAll";
      dependency.tokenRef = isTokenRef(token) ? token : tokenRef(() => token);
      checkNamedDecorator(dependency, target, propertyKey, parameterIndex);
    });
  };
}
