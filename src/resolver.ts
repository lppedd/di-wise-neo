import type {InjectionConfig} from './config'
import type {InjectionProvider} from './provider'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export type Resolvable<T> =
  | InjectionToken<T>
  | InjectionConfig<T>
  | InjectionProvider<T>

/** @internal */
export type ResolvedScope = Exclude<InjectionScope, typeof InjectionScope.Inherited>

/** @internal */
export interface Resolver {
  scope: ResolvedScope
  stack: InjectionToken[]
  deferredInstances: Map<InjectionToken, any>
  resolvedInstances: Map<InjectionToken, any>
  resolve<T>(resolvable: Resolvable<T>): T
}

/** @internal */
export type ResolverProvider = <T>(resolver: Resolver, callback: ResolverCallback<T>) => T
/** @internal */
export type ResolverCallback<T> = (resolver: Resolver) => T
/** @internal */
export type ResolverConsumer = () => Resolver | null

/** @internal */
function createResolverContext() {
  let contextResolver: Resolver | null = null

  const withResolver: ResolverProvider = (resolver, callback) => {
    const currentResolver = contextResolver
    contextResolver = resolver
    try {
      return callback(resolver)
    }
    finally {
      contextResolver = currentResolver
    }
  }

  const useResolver: ResolverConsumer = () => {
    return contextResolver
  }

  return {withResolver, useResolver}
}

/** @internal */
export const {withResolver, useResolver} = createResolverContext()
