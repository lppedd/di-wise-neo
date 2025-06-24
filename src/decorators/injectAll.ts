import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Token, TokenList, Tokens } from "../token";

/**
 * Decorator for injecting instances of a class with all registered providers.
 */
export function InjectAll<Instance extends object>(Class: Constructor<Instance>): PropertyDecorator;

/**
 * Decorator for injecting the values of a token created by all its registered providers.
 */
export function InjectAll<Value>(token: Token<Value>): PropertyDecorator;

/**
 * Decorator for injecting values by sequentially checking each token
 * in the provided list until a registered one is found.
 */
export function InjectAll<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): PropertyDecorator;

export function InjectAll<T>(...tokens: Tokens<T>): PropertyDecorator {
  return function (target, propertyKey) {
    // Error out immediately if the decorator has been applied to a static property
    if (propertyKey !== undefined && typeof target === "function") {
      const message = `@InjectAll cannot be used on static member ${target.name}.${String(propertyKey)}`;
      assert(false, message);
    }

    // Class property decorator
    const metadata = getMetadata(target.constructor as Constructor<any>);
    metadata.dependencies.properties.push({
      key: propertyKey,
      tokens: tokens,
      type: "injectAll",
    });
  };
}
