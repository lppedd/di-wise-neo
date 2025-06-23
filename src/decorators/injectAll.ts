import { injectAll } from "../injectAll";
import type { Constructor, Token, TokenList } from "../token";
import type { ClassFieldDecorator } from "./decorators";

/**
 * Decorator for injecting instances of a class with all registered providers.
 */
export function InjectAll<Instance extends object>(
  Class: Constructor<Instance>,
): ClassFieldDecorator<Instance[]>;

/**
 * Decorator for injecting the values of a token from all its registered providers.
 *
 * The returned array will not contain `null` or `undefined` values.
 */
export function InjectAll<Value>(token: Token<Value>): ClassFieldDecorator<NonNullable<Value>[]>;

/**
 * Decorator for injecting the values of a token from all its registered providers,
 * by checking each token in order until a registered one is found.
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
