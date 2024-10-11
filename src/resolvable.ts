import type {InjectionConfig} from './config'
import type {InjectionToken} from './token'

export type Resolvable<Value> =
  | InjectionToken<Value>
  | InjectionConfig<Value>

export type Resolvables<Values extends unknown[]> =
  {[Index in keyof Values]: Resolvable<Values[Index]>}
