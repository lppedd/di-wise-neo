import type {InjectionConfig, InjectionConfigLike} from './config'
import type {Constructor, InjectionToken} from './token'

export type InjectionProvider<T = any> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | TokenProvider<T>
  | ValueProvider<T>

export interface ClassProvider<T> extends InjectionConfig<T> {
  useClass: Constructor<T>
}

export interface FactoryProvider<T> extends InjectionConfig<T> {
  useFactory: () => T
}

export interface TokenProvider<T> extends InjectionConfigLike<T> {
  useToken: InjectionToken<T>
}

export interface ValueProvider<T> extends InjectionConfigLike<T> {
  useValue: T
}

/** @internal */
export function isClassProvider<T>(provider: InjectionProvider<T>) {
  return 'useClass' in provider
}

/** @internal */
export function isFactoryProvider<T>(provider: InjectionProvider<T>) {
  return 'useFactory' in provider
}

/** @internal */
export function isTokenProvider<T>(provider: InjectionProvider<T>) {
  return 'useToken' in provider
}

/** @internal */
export function isValueProvider<T>(provider: InjectionProvider<T>) {
  return 'useValue' in provider
}
