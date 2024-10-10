import type {Resolvable} from './resolvable'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionConfig<T extends any[]> {
  scope?: InjectionScope
  tokens: {[K in keyof T]: InjectionToken<T[K]>}
}

/** @internal */
export function isConfig<T>(resolvable: Resolvable<T>) {
  return 'tokens' in resolvable
}
