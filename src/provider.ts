import type {InjectionConfig, InjectionConfigLike} from './config'
import type {Resolvable} from './resolvable'
import type {Constructor, InjectionToken} from './token'

export type Providable<T> =
  | Constructor<T>
  | InjectionProvider<T>

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
export function isProvider<T>(resolvable: Resolvable<T>) {
  return (
    isClassProvider(resolvable)
    || isFactoryProvider(resolvable)
    || isTokenProvider(resolvable)
    || isValueProvider(resolvable)
  )
}

/** @internal */
export function isClassProvider<T>(resolvable: Resolvable<T>) {
  return 'useClass' in resolvable
}

/** @internal */
export function isFactoryProvider<T>(resolvable: Resolvable<T>) {
  return 'useFactory' in resolvable
}

/** @internal */
export function isTokenProvider<T>(resolvable: Resolvable<T>) {
  return 'useToken' in resolvable
}

/** @internal */
export function isValueProvider<T>(resolvable: Resolvable<T>) {
  return 'useValue' in resolvable
}
