import type {Resolvable} from './resolver'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionConfigLike<T> {
  token: InjectionToken<T>
}

export interface InjectionConfig<T> extends InjectionConfigLike<T> {
  scope?: InjectionScope
}

/** @internal */
export function isConfigLike<T>(resolvable: Resolvable<T>) {
  return 'token' in resolvable
}
