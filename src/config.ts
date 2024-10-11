import type {Injection} from './injection'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

// TODO: extract InjectionConfigLike
export interface InjectionConfig<Value> {
  scope?: InjectionScope
  token: InjectionToken<Value>
}

/** @internal */
export function isConfig<T>(injection: Injection<T>) {
  return 'token' in injection
}
