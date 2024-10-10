import type {Resolvable} from './resolvable'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionConfig<T> {
  scope?: InjectionScope
  tokens: InjectionToken<T>[]
}

/** @internal */
export function isConfigLike<T>(resolvable: Resolvable<T>) {
  return 'tokens' in resolvable
}
