import type {Resolvable} from './resolver'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionConfig<T> {
  token: InjectionToken<T>
  scope?: InjectionScope
}

/** @internal */
export function isConfigLike<T>(resolvable: Resolvable<T>) {
  return 'token' in resolvable
}
