import { injectBy } from "../inject";
import type { Constructor, Token, TokenList } from "../token";
import type { ClassFieldDecorator } from "./decorators";

/**
 * Decorator for injecting an instance of a class.
 */
export function Inject<Instance extends object>(
  Class: Constructor<Instance>,
): ClassFieldDecorator<Instance>;

/**
 * Decorator for injecting an instance of a token.
 */
export function Inject<Value>(token: Token<Value>): ClassFieldDecorator<Value>;

/**
 * Decorator for injecting an instance of a token, by checking each token in order until a registered one is found.
 */
export function Inject<Values extends unknown[]>(
  ...tokens: TokenList<Values>
): ClassFieldDecorator<Values[number]>;

export function Inject<T>(...tokens: Token<T>[]): ClassFieldDecorator<T> {
  return () =>
    function (this) {
      return injectBy(this, ...tokens);
    };
}
