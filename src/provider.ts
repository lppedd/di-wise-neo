import type {InjectionScope} from './scope'
import type {Constructor, InjectionToken} from './token'

export type Provider<T = any> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | TokenProvider<T>
  | ValueProvider<T>

export interface ClassProvider<T> {
  scope?: InjectionScope
  token: InjectionToken<T>
  useClass: Constructor<T>
}

export interface FactoryProvider<T> {
  scope?: InjectionScope
  token: InjectionToken<T>
  useFactory: (...args: []) => T
}

export interface TokenProvider<T> {
  token: InjectionToken<T>
  useToken: InjectionToken<T>
}

export interface ValueProvider<T> {
  token: InjectionToken<T>
  useValue: T
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
