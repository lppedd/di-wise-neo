import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Token, TokenList, Tokens } from "../token";

/**
 * Decorator for injecting an instance of a class.
 */
export function Inject<Instance extends object>(Class: Constructor<Instance>): PropertyDecorator;

/**
 * Decorator for injecting the value of a token.
 */
export function Inject<Value>(token: Token<Value>): PropertyDecorator;

/**
 * Decorator for injecting a value by sequentially checking each token
 * in the provided list until a registered one is found.
 */
export function Inject<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): PropertyDecorator;

export function Inject<T>(...tokens: Tokens<T>): PropertyDecorator {
  return function (target, propertyKey) {
    // Error out immediately if the decorator has been applied to a static property
    if (propertyKey !== undefined && typeof target === "function") {
      const message = `@Inject cannot be used on static member ${target.name}.${String(propertyKey)}`;
      assert(false, message);
    }

    // Class property decorator
    const metadata = getMetadata(target.constructor as Constructor<any>);
    metadata.dependencies.properties.push({
      key: propertyKey,
      tokens: tokens,
      type: "inject",
    });
  };
}
