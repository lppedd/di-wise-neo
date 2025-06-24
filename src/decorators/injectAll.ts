import type { Constructor, Token, TokenList } from "../token";
import type { TokensRef } from "../tokensRef";
import { processDecoratedParameter } from "./decorators";

/**
 * Decorator for injecting instances of a class with all registered providers.
 */
export function InjectAll<Instance extends object>(
  Class: Constructor<Instance>,
): ParameterDecorator;

/**
 * Decorator for injecting the values of a token created by all its registered providers.
 */
export function InjectAll<Value>(token: Token<Value>): ParameterDecorator;

/**
 * Decorator for injecting values by sequentially checking each token
 * in the provided list until a registered one is found.
 */
export function InjectAll<Values extends [unknown, ...unknown[]]>(
  ...tokens: TokenList<Values>
): ParameterDecorator;

/**
 * Decorator for injecting values by sequentially checking each token
 * in the provided list until a registered one is found.
 *
 * Allows referencing tokens that are declared after this usage.
 */
export function InjectAll<Value>(tokens: TokensRef<Value>): ParameterDecorator;

export function InjectAll(...args: unknown[]): ParameterDecorator {
  return function (target, propertyKey, parameterIndex: number): void {
    processDecoratedParameter("InjectAll", args, target, propertyKey, parameterIndex);
  };
}
