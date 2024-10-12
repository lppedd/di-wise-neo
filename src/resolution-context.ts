import {createContext} from './create-context'
import {InjectionScope} from './scope'
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

export function createResolutionContext(scope: InjectionScope): ResolutionContext {
  const currentContext = useResolutionContext()
  let resolvedScope = scope
  if (resolvedScope == InjectionScope.Inherited) {
    resolvedScope = currentContext?.scope || InjectionScope.Transient
  }
  if (currentContext) {
    return {
      ...currentContext,
      scope: resolvedScope,
    }
  }
  return {
    stack: [],
    instances: new Map(),
    dependents: new Map(),
    scope: resolvedScope,
  }
}

// @internal
export const [withResolutionContext, useResolutionContext] = createContext<ResolutionContext>()
