import type {InjectionConfig} from './config'
import type {InjectionToken} from './token'

export type Resolvable<T> =
  | InjectionToken<T>
  | InjectionConfig<T>
