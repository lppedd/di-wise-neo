import type { Constructor, Token, TokenList } from "../token";
import { processDecoratedSymbol } from "./decorators";
import type { TokensRef } from "./tokensRef";

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
    processDecoratedSymbol("Inject", propertyKey, target, args, parameterIndex);
  };
}
