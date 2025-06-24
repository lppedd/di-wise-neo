import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Token, TokenList, Tokens } from "../token";
import { isTokensRef, ref, type TokensRef } from "./tokensRef";

/**
 * Decorator for injecting an instance of a class.
 */
export function Inject<Instance extends object>(
  Class: Constructor<Instance>,
): ParameterDecorator & PropertyDecorator;

/**
 * Decorator for injecting the value of a token.
 */
export function Inject<Value>(token: Token<Value>): ParameterDecorator & PropertyDecorator;

/**
 * Decorator for injecting a value by sequentially checking each token
 * in the provided list until a registered one is found.
 */
export function Inject<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): ParameterDecorator & PropertyDecorator;

/**
 * Decorator for injecting a value by sequentially checking each token
 * in the provided list until a registered one is found.
 *
 * Allows referencing tokens that are declared after this usage.
 */
export function Inject<Value>(tokens: TokensRef<Value>): ParameterDecorator & PropertyDecorator;

export function Inject(...args: unknown[]): ParameterDecorator & PropertyDecorator {
  return function (target, propertyKey, parameterIndex?: number) {
    // Error out immediately if the decorator has been applied
    // to a static property or a static method
    if (propertyKey !== undefined && typeof target === "function") {
      const message = `@Inject cannot be used on static member ${target.name}.${String(propertyKey)}`;
      assert(false, message);
    }

    const tokensRef = isTokensRef(args[0]) ? args[0] : ref(() => args as Token | Tokens);

    if (typeof parameterIndex === "number") {
      // Method parameter decorator
      //
      // When propertyKey is undefined, the decorator has been applied to a constructor parameter.
      // Otherwise, it is a standard instance method.
      if (propertyKey === undefined) {
        const metadata = getMetadata(target as Constructor<any>);
        metadata.dependencies.constructor.push({
          tokensRef: tokensRef,
          type: "inject",
          index: parameterIndex,
        });
      } else {
        const metadata = getMetadata(target.constructor as Constructor<any>);
        const methods = metadata.dependencies.methods;
        let dep = methods.get(propertyKey);

        if (dep === undefined) {
          dep = [];
          methods.set(propertyKey, dep);
        }

        dep.push({
          tokensRef: tokensRef,
          type: "inject",
          index: parameterIndex,
        });
      }
    } else {
      // Class property decorator
      const metadata = getMetadata(target.constructor as Constructor<any>);
      metadata.dependencies.properties.push({
        tokensRef: tokensRef,
        type: "inject",
        key: propertyKey!,
      });
    }
  };
}
