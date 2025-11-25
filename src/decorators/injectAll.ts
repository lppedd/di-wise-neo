import type { Constructor, Token } from "../token";
import { isTokenRef, type TokenRef, tokenRef } from "../tokenRef";
import type { ParameterDecorator } from "./decorators";
import { checkNamedDecorator, checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects all instances provided by the registrations
 * associated with the given class.
 *
 * Throws an error if:
 * - The class is not registered in the container.
 * - A circular dependency is detected.
 */
export function InjectAll<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token.
 *
 * Throws an error if:
 * - The token is not registered in the container.
 * - A circular dependency is detected.
 */
export function InjectAll<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token.
 *
 * Allows referencing a token declared later in the file by using the
 * {@link tokenRef} helper function.
 *
 * Throws an error if:
 * - The token is not registered in the container.
 * - A circular dependency is detected.
 *
 * @example
 * ```ts
 * class Wizard {
 *   constructor(@InjectAll(tokenRef(() => Wand)) readonly wands: Wand[]) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function InjectAll<Value>(tokens: TokenRef<Value>): ParameterDecorator;

// @__NO_SIDE_EFFECTS__
export function InjectAll<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("InjectAll", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "InjectAll";
      dependency.tokenRef = isTokenRef(token) ? token : tokenRef(() => token);
      checkNamedDecorator(dependency, target, propertyKey, parameterIndex);
    });
  };
}
