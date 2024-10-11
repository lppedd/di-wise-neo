import type {InjectionScope} from './scope'
import type {Constructor, InjectionToken} from './token'

export function defineProvider<Value>(provider: Provider<Value>): Provider<Value> {
  return provider
}

export type Provider<Value = any> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | TokenProvider<Value>
  | ValueProvider<Value>

export interface ClassProvider<Instance extends object> {
  scope?: InjectionScope
  token: InjectionToken<Instance>
  useClass: Constructor<Instance>
}

export interface FactoryProvider<Value> {
  scope?: InjectionScope
  token: InjectionToken<Value>
  useFactory: (...args: []) => Value
}

export interface TokenProvider<Value> {
  token: InjectionToken<Value>
  useToken: InjectionToken<Value>
}

export interface ValueProvider<Value> {
  token: InjectionToken<Value>
  useValue: Value
}

/** @internal */
export function isClassProvider<T>(provider: Provider<T>) {
  return 'useClass' in provider
}

/** @internal */
export function isFactoryProvider<T>(provider: Provider<T>) {
  return 'useFactory' in provider
}

/** @internal */
export function isTokenProvider<T>(provider: Provider<T>) {
  return 'useToken' in provider
}

/** @internal */
export function isValueProvider<T>(provider: Provider<T>) {
  return 'useValue' in provider
}

/** @internal */
export function getScope(provider: Provider) {
  if ('scope' in provider) {
    return provider.scope
  }
}
