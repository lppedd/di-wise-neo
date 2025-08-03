// SPDX-License-Identifier: MIT

import type { Constructor, Token } from "../token";
import { forwardRef, isTokenRef, type TokenRef } from "../tokensRef";
import { checkSingleDecorator, updateParameterMetadata } from "./utils";

/**
 * Parameter decorator that injects all instances provided by the registrations
 * associated with the given class, or an empty array if the class is not registered
 * in the container.
 */
export function OptionalAll<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token, or an empty array if the token is not registered
 * in the container.
 */
export function OptionalAll<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Parameter decorator that injects all values provided by the registrations
 * associated with the given token, or an empty array if the token is not registered
 * in the container.
 *
 * Allows referencing a token that is declared later in the file by using
 * the {@link forwardRef} helper function.
 *
 * @example
 * ```ts
 * class Wizard {
 *   constructor(@OptionalAll(forwardRef(() => Wand)) readonly wands: Wand[]) {}
 * }
 * // Other code...
 * class Wand {}
 * ```
 */
export function OptionalAll<Value>(tokens: TokenRef<Value>): ParameterDecorator;

export function OptionalAll<T>(token: Token<T> | TokenRef<T>): ParameterDecorator {
  return function (target, propertyKey, parameterIndex): void {
    updateParameterMetadata("OptionalAll", target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "OptionalAll";
      dependency.tokenRef = isTokenRef(token) ? token : forwardRef(() => token);
    });
  };
}
