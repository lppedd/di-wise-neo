import type {Container} from './container'
import {createContext} from './create-context'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionContext {
  container: Container
  resolution: Resolution
}

export interface Resolution {
  stack: ResolutionFrame[]
  instances: Map<InjectionToken, any>
  dependents: Map<InjectionToken, any>
}

export interface ResolutionFrame {
  scope: ResolvedScope
  token: InjectionToken
}

export type ResolvedScope = Exclude<
  InjectionScope,
  typeof InjectionScope.Inherited
>

// @internal
export const [withInjectionContext, useInjectionContext] = createContext<InjectionContext>()
