import type {InjectionConfig} from './config'
import type {InjectionProvider} from './provider'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export type Resolvable<T> =
  | InjectionToken<T>
  | InjectionConfig<T>
  | InjectionProvider<T>

export type ResolvedScope = Exclude<InjectionScope, typeof InjectionScope.Inherited>

export interface Resolver {
  scope: ResolvedScope
  stack: InjectionToken[]
  dependents: Map<InjectionToken, any>
  resolutions: Map<InjectionToken, any>
  resolve<T>(resolvable: Resolvable<T>): T
}

export type ResolverCallback<T> = (resolver: Resolver) => T

function createResolverContext() {
  let contextResolver: Resolver | null = null

  const withResolver = <T>(resolver: Resolver, callback: ResolverCallback<T>) => {
    const currentResolver = contextResolver
    contextResolver = resolver
    try {
      return callback(resolver)
    }
    finally {
      contextResolver = currentResolver
    }
  }

  const useResolver = () => {
    return contextResolver
  }

  return {withResolver, useResolver}
}

/** @internal */
export const {withResolver, useResolver} = createResolverContext()
