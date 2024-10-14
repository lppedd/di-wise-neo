import type {Injection} from './injection'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionConfig<Value>
  extends InjectionConfigLike<Value>, InjectionScopeConfig {}

export interface InjectionScopeConfig {
  readonly scope?: InjectionScope
}

export interface InjectionConfigLike<Value> {
  readonly token: InjectionToken<Value>
}

// @internal
export function isConfigLike<T>(injection: Injection<T>) {
  return 'token' in injection
}
