import {createContext} from './create-context'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface ResolutionContext {
  scope: ResolvedScope
  stack: InjectionToken[]
  instances: Map<InjectionToken, any>
  dependents: Map<InjectionToken, any>
}

export type ResolvedScope = Exclude<
  InjectionScope,
  typeof InjectionScope.Inherited
>

// @internal
export const [withResolutionContext, useResolutionContext] = createContext<ResolutionContext>()
