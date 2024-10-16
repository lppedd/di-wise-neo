import type {Constructor} from "./token";

export type InjectionProvider<Value = any> =
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

// TODO: merge with metadata registry
class ProviderRegistry {
  private map = new WeakMap<Constructor<object>, InjectionProvider>();

  ensure<T extends object>(Class: Constructor<T>): InjectionProvider<T> {
    let provider = this.map.get(Class);
    if (!provider) {
      provider = {useClass: Class};
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
