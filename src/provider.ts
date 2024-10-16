import {getMetadata} from "./metadata";
import type {InjectionScope} from "./scope";
import type {Constructor} from "./token";

export type InjectionProvider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>;

export interface InjectionOptions {
  scope?: InjectionScope;
}

export interface ClassProvider<Instance extends object> extends InjectionOptions {
  useClass: Constructor<Instance>;
}

export interface FactoryProvider<Value> extends InjectionOptions {
  useFactory: (...args: []) => Value;
}

export interface ValueProvider<T> extends InjectionOptions {
  useValue: T;
  scope?: undefined;
}

// @internal
export const NullProvider = {useValue: null};

// @internal
export const UndefinedProvider = {useValue: undefined};

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

class ProviderRegistry {
  private map = new WeakMap<Constructor<object>, InjectionProvider>();

  ensure<T extends object>(Class: Constructor<T>): InjectionProvider<T> {
    let provider = this.map.get(Class);
    if (!provider) {
      const metadata = getMetadata(Class);
      provider = {
        useClass: Class,
        scope: metadata?.scope,
      };
      this.map.set(Class, provider);
    }
    return provider;
  }
}

const providerRegistry = new ProviderRegistry();

// @internal
export function getProvider<T extends object>(Class: Constructor<T>): InjectionProvider<T> {
  return providerRegistry.ensure(Class);
}
