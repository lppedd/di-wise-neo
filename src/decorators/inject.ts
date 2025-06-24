import type { Constructor, Token, TokenList } from "../token";
import { processDecoratedParameter } from "./decorators";
import type { TokensRef } from "./tokensRef";

/**
 * Decorator for injecting an instance of a class.
 */
export function Inject<Instance extends object>(Class: Constructor<Instance>): ParameterDecorator;

/**
 * Decorator for injecting the value of a token.
 */
export function Inject<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Decorator for injecting a value by sequentially checking each token
 * in the provided list until a registered one is found.
 */
export function Inject<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): ParameterDecorator;

/**
 * Decorator for injecting a value by sequentially checking each token
 * in the provided list until a registered one is found.
 *
 * Allows referencing tokens that are declared after this usage.
 */
export function Inject<Value>(tokens: TokensRef<Value>): ParameterDecorator;

export function Inject(...args: unknown[]): ParameterDecorator {
  return function (target, propertyKey, parameterIndex: number): void {
    processDecoratedParameter("Inject", args, target, propertyKey, parameterIndex);
  };
}
