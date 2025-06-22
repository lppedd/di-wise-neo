import { injectAll } from "../inject";
import type { Constructor, Token, TokenList } from "../token";
import type { ClassFieldDecorator } from "./decorators";

/**
 * Decorator for injecting instances of a class with all registered providers.
 */
export function InjectAll<Instance extends object>(
  Class: Constructor<Instance>,
): ClassFieldDecorator<Instance[]>;

/**
 * Decorator for injecting instances of a token with all registered providers.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function InjectAll<Value>(token: Token<Value>): ClassFieldDecorator<NonNullable<Value>[]>;

/**
 * Decorator for injecting instances of a token with all registered providers, by checking each token in order until a registered one is found.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function InjectAll<Values extends unknown[]>(
  ...tokens: TokenList<Values>
): ClassFieldDecorator<NonNullable<Values[number]>[]>;

export function InjectAll<T>(...tokens: Token<T>[]): ClassFieldDecorator<NonNullable<T>[]> {
  return () =>
    function () {
      return injectAll(...tokens);
    };
}
