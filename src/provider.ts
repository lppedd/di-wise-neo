import type {InjectionScope} from "./scope";
import {type Constructor, type InjectionToken, Type} from "./token";

export type InjectionProvider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>;

export interface InjectionConfig<Value> {
  scope?: InjectionScope;
  token: InjectionToken<Value>;
}

export interface ClassProvider<Instance extends object> extends InjectionConfig<Instance> {
  useClass: Constructor<Instance>;
}

export interface FactoryProvider<Value> extends InjectionConfig<Value> {
  useFactory: (...args: []) => Value;
}

export interface ValueProvider<T> extends InjectionConfig<T> {
  useValue: T;
}

export function defineProvider<Value>(provider: InjectionProvider<Value>): InjectionProvider<Value> {
  return provider;
}

// @internal
export const NullProvider = defineProvider({
  token: Type.Null,
  useValue: null,
});

// @internal
export const UndefinedProvider = defineProvider({
  token: Type.Undefined,
  useValue: undefined,
});

// @internal
export function isClassProvider<T>(provider: InjectionProvider<T>) {
  return "useClass" in provider;
}

// @internal
export function isFactoryProvider<T>(provider: InjectionProvider<T>) {
  return "useFactory" in provider;
}

// @internal
export function isValueProvider<T>(provider: InjectionProvider<T>) {
  return "useValue" in provider;
}
