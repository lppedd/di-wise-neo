import { injectAll } from "../injectAll";
import type { Constructor, Token, TokenList, Tokens } from "../token";
import type { ClassFieldDecorator } from "./decorators";

/**
 * Decorator for injecting instances of a class with all registered providers.
 */
export function InjectAll<Instance extends object>(
  Class: Constructor<Instance>,
): ClassFieldDecorator<Instance[]>;

/**
 * Decorator for injecting the values of a token created by all its registered providers.
 */
export function InjectAll<Value>(token: Token<Value>): ClassFieldDecorator<NonNullable<Value>[]>;

/**
 * Decorator for injecting values by sequentially checking each token
 * in the provided list until a registered one is found.
 */
export function InjectAll<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): ClassFieldDecorator<NonNullable<Values[number]>[]>;

export function InjectAll<T>(...tokens: Tokens<T>): ClassFieldDecorator<NonNullable<T>[]> {
  return () =>
    function () {
      return injectAll(...tokens);
    };
}
