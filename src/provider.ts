import type {InjectionConfig} from './config'
import type {Resolvable} from './resolver'
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

export interface TokenProvider<T> extends InjectionConfig<T> {
  useToken: InjectionToken<T>
  scope?: undefined
}

export interface ValueProvider<T> extends InjectionConfig<T> {
  useValue: T
  scope?: undefined
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
