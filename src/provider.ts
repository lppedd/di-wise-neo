import type {InjectionConfig, InjectionConfigLike} from "./config";
import type {Injection} from "./injection";
import {InjectionScope} from "./scope";
import {type Constructor, Type} from "./token";

export type InjectionProvider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>;

export interface ClassProvider<Instance extends object> extends InjectionConfig<Instance> {
  readonly useClass: Constructor<Instance>;
}

export interface FactoryProvider<Value> extends InjectionConfig<Value> {
  readonly useFactory: Factory<Value>;
}

export type Factory<Value> = (...args: []) => Value;

export function Build<Value>(factory: Factory<Value>): FactoryProvider<Value> {
  return {
    scope: InjectionScope.Transient,
    token: Type.Any,
    useFactory: factory,
  };
}

export interface ValueProvider<T> extends InjectionConfigLike<T> {
  readonly useValue: T;
}

export function Value<T>(value: T): ValueProvider<T> {
  return {
    token: Type.Any,
    useValue: value,
  };
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
export function isProvider<T>(injection: Injection<T>) {
  return (
    isValueProvider(injection)
    || isClassProvider(injection)
    || isFactoryProvider(injection)
  );
}

// @internal
export function isClassProvider<T>(injection: Injection<T>) {
  return "useClass" in injection;
}

// @internal
export function isFactoryProvider<T>(injection: Injection<T>) {
  return "useFactory" in injection;
}

// @internal
export function isValueProvider<T>(injection: Injection<T>) {
  return "useValue" in injection;
}
