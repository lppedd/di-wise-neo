import type { Constructor, Token } from "./token";

/**
 * Provides a class instance for a token via a class constructor.
 */
export interface ClassProvider<Instance extends object> {
  readonly useClass: Constructor<Instance>;
}

/**
 * Provides a value for a token via another existing token.
 */
export interface ExistingProvider<Value> {
  readonly useExisting: Token<Value>;
}

/**
 * Provides a value for a token via a factory function.
 *
 * The factory function runs inside the injection context
 * and can thus access dependencies via {@link inject}.
 */
export interface FactoryProvider<Value> {
  readonly useFactory: (...args: []) => Value;
}

/**
 * Provides a direct - already constructed - value for a token.
 */
export interface ValueProvider<T> {
  readonly useValue: T;
}

/**
 * A token provider.
 */
export type Provider<Value = any> =
  | ClassProvider<Value & object>
  | ExistingProvider<Value>
  | FactoryProvider<Value>
  | ValueProvider<Value>;

// @internal
export const NullProvider: ValueProvider<null> = {
  useValue: null,
};

// @internal
export const UndefinedProvider: ValueProvider<undefined> = {
  useValue: undefined,
};

// @internal
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T & object> {
  return "useClass" in provider;
}

// @internal
export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return "useExisting" in provider;
}

// @internal
export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return "useFactory" in provider;
}

// @internal
export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "useValue" in provider;
}
