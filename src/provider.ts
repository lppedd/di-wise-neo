import type {InjectionConfig, InjectionConfigLike, InjectionScopeConfig} from './config'
import type {Injection} from './injection'
import type {Constructor, InjectionToken} from './token'

export function defineProvider<Value>(provider: InjectionProvider<Value>): InjectionProvider<Value> {
  return provider
}

export type InjectionProvider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | TokenProvider<Value>
  | ValueProvider<Value>

export type ScopedProvider<Value> = Extract<
  InjectionProvider<Value>,
  InjectionScopeConfig
>

export interface ClassProvider<Instance extends object> extends InjectionConfig<Instance> {
  useClass: Constructor<Instance>
}

export interface FactoryProvider<Value> extends InjectionConfig<Value> {
  useFactory: (...args: []) => Value
}

export interface TokenProvider<Value> extends InjectionConfigLike<Value> {
  useToken: InjectionToken<Value>
}

export interface ValueProvider<Value> extends InjectionConfigLike<Value> {
  useValue: Value
}

/** @internal */
export function isProvider<T>(injection: Injection<T>) {
  return (
    isClassProvider(injection)
    || isFactoryProvider(injection)
    || isTokenProvider(injection)
    || isValueProvider(injection)
  )
}

/** @internal */
export function isClassProvider<T>(injection: Injection<T>) {
  return 'useClass' in injection
}

/** @internal */
export function isFactoryProvider<T>(injection: Injection<T>) {
  return 'useFactory' in injection
}

/** @internal */
export function isTokenProvider<T>(injection: Injection<T>) {
  return 'useToken' in injection
}

/** @internal */
export function isValueProvider<T>(injection: Injection<T>) {
  return 'useValue' in injection
}
