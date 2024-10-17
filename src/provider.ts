import type {Constructor} from "./token";

export type Provider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>;

export interface ClassProvider<Instance extends object> {
  useClass: Constructor<Instance>;
}

export interface FactoryProvider<Value> {
  useFactory: (...args: []) => Value;
}

export interface ValueProvider<T> {
  useValue: T;
}

// @internal
export const NullProvider = {useValue: null};

// @internal
export const UndefinedProvider = {useValue: undefined};

// @internal
export function isClassProvider<T>(provider: Provider<T>) {
  return "useClass" in provider;
}

// @internal
export function isFactoryProvider<T>(provider: Provider<T>) {
  return "useFactory" in provider;
}

// @internal
export function isValueProvider<T>(provider: Provider<T>) {
  return "useValue" in provider;
}
