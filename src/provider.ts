import type { Constructor, Token } from "./token";

/**
 * Provides a class instance for a token via a class constructor.
 */
export interface ClassProvider<Instance extends object> {
  readonly useClass: Constructor<Instance>;
  readonly name?: string;
}

/**
 * Provides a value for a token via a factory function.
 *
 * The factory function runs inside the injection context and can
 * thus access dependencies via {@link inject}-like functions.
 */
export interface FactoryProvider<Value> {
  readonly useFactory: (...args: []) => Value;
  readonly name?: string;
}

/**
 * Provides a static - already constructed - value for a token.
 */
export interface ValueProvider<T> {
  readonly useValue: T;
  readonly name?: string;
}

/**
 * Aliases another registered token.
 *
 * Resolving this token will return the value of the aliased one.
 */
export interface ExistingProvider<Value> {
  readonly useExisting: Token<Value>;
}

/**
 * A token provider.
 */
export type Provider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>
  | ExistingProvider<Value>;

// @internal
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T & object> {
  return "useClass" in provider;
}

// @internal
export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return "useFactory" in provider;
}

// @internal
export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "useValue" in provider;
}

// @internal
export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return "useExisting" in provider;
}
