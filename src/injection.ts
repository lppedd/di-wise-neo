import type {InjectionConfig} from './config'
import type {InjectionToken} from './token'

export type Injection<Value> =
  | InjectionToken<Value>
  | InjectionConfig<Value>

export type Injections<Values extends unknown[]> =
  {[Index in keyof Values]: Injection<Values[Index]>}
