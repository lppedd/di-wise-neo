import type {Resolvable} from './resolvable'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

// TODO: extract InjectionConfigLike
export interface InjectionConfig<Value> {
  scope?: InjectionScope
  token: InjectionToken<Value>
}

/** @internal */
export function isConfig<T>(resolvable: Resolvable<T>) {
  return 'token' in resolvable
}
