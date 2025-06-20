import type { Constructor } from "./token";

/**
 * Provider type.
 */
export type Provider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>;

/**
 * Class provider type.
 */
export interface ClassProvider<Instance extends object> {
  readonly useClass: Constructor<Instance>;
}

/**
 * Factory provider type.
 */
export interface FactoryProvider<Value> {
  readonly useFactory: (...args: []) => Value;
}

/**
 * Value provider type.
 */
export interface ValueProvider<T> {
  readonly useValue: T;
}

// @internal
export const NullProvider = { useValue: null };

// @internal
export const UndefinedProvider = { useValue: undefined };

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
