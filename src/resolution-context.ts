import {createContext} from './create-context'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface ResolutionContext {
  stack: ResolutionFrame[]
  instances: Map<InjectionToken, any>
  dependents: Map<InjectionToken, any>
}

export type ResolvedScope = Exclude<
  InjectionScope,
  typeof InjectionScope.Inherited
>

export interface ResolutionFrame {
  scope: ResolvedScope
  token: InjectionToken
}

// @internal
export const [withResolutionContext, useResolutionContext] = createContext<ResolutionContext>()
