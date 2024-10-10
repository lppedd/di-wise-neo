import {type InjectionConfig, isConfigLike} from './config'
import {assert, ErrorMessage, expectNever} from './errors'
import {getMetadata} from './metadata'
import {
  type InjectionProvider,
  isClassProvider,
  isFactoryProvider,
  isProvider,
  isTokenProvider,
  isValueProvider,
  type Providable,
} from './provider'
import {
  type Resolvable,
  type Resolver,
  type ResolverCallback,
  useResolver,
  withResolver,
} from './resolver'
import {InjectionScope} from './scope'
import {type InjectionToken, isConstructor} from './token'

export interface ContainerOptions {
  parent?: Container
  defaultScope?: InjectionScope
}

export class Container {
  readonly instanceCache: Map<InjectionToken, any> = new Map()
  readonly providerRegistry: Map<InjectionToken, InjectionProvider> = new Map()

  parent?: Container
  defaultScope: InjectionScope

  constructor(options: ContainerOptions = {}) {
    this.parent = options.parent
    this.defaultScope = options.defaultScope || InjectionScope.Inherited
  }

  createChild(): Container {
    return new Container({
      parent: this,
      defaultScope: this.defaultScope,
    })
  }

  isRegistered<T>(token: InjectionToken<T>): boolean {
    return (
      this.providerRegistry.has(token)
      || !!(this.parent?.isRegistered(token))
    )
  }

  register<T>(providable: Providable<T>): void {
    let provider: InjectionProvider<T>
    if (isProvider(providable)) {
      provider = providable
    }
    else {
      const Class = providable
      const metadata = getMetadata(Class)
      const token = metadata?.token || Class
      provider = {
        token,
        useClass: Class,
        scope: metadata?.scope,
      }
    }
    const token = provider.token
    this.providerRegistry.set(token, provider)
  }

  resolve = <T>(resolvable: Resolvable<T>): T => {
    let token: InjectionToken<T>
    let provider: InjectionProvider<T> | undefined
    if (isConfigLike(resolvable)) {
      token = resolvable.token
      if (isProvider(resolvable)) {
        provider = resolvable
      }
      else {
        const config = resolvable
        provider = this.resolveProvider(token)
        if (provider && config.scope) {
          provider = Object.assign({}, provider, config)
        }
      }
    }
    else {
      token = resolvable
      provider = this.resolveProvider(token)
    }
    assert(provider, ErrorMessage.UnresolvableToken, token.name)
    return this.resolveInstance(provider)
  }

  resolveProvider<T>(token: InjectionToken<T>): InjectionProvider<T> | undefined {
    if (isConstructor(token)) {
      const Class = token
      const provider = this.providerRegistry.get(token)
      if (provider) {
        return provider
      }
      const metadata = getMetadata(Class)
      return {
        token,
        useClass: Class,
        scope: metadata?.scope,
      }
    }
    else {
      const provider = this.providerRegistry.get(token)
      if (provider) {
        return provider
      }
      return this.parent?.resolveProvider(token)
    }
  }

  resolveInstance<T>(provider: InjectionProvider<T>): T {
    if (isClassProvider(provider)) {
      const Class = provider.useClass
      return this.resolveScopedInstance(provider, (resolver) => {
        const instance = new Class()
        const metadata = getMetadata(Class)
        if (metadata?.dependencies) {
          const token = provider.token
          resolver.dependents.set(token, instance)
          try {
            metadata.dependencies.forEach((dependency) => {
              const value = this.resolve(dependency.resolvable)
              dependency.setValue(instance, value)
            })
          }
          finally {
            resolver.dependents.delete(token)
          }
        }
        return instance
      })
    }
    else if (isFactoryProvider(provider)) {
      const factory = provider.useFactory
      return this.resolveScopedInstance(provider, () => factory())
    }
    else if (isTokenProvider(provider)) {
      const forwardToken = provider.useToken
      return this.resolve(forwardToken)
    }
    else if (isValueProvider(provider)) {
      const value = provider.useValue
      return value
    }
    expectNever(provider)
  }

  private resolveScopedInstance<T>(config: InjectionConfig<T>, instantiate: ResolverCallback<T>): T {
    const token = config.token
    const resolver = this.createResolver(config.scope)
    if (resolver.stack.includes(token)) {
      if (resolver.dependents.has(token)) {
        return resolver.dependents.get(token)
      }
      assert(false, ErrorMessage.CircularDependency, token.name)
    }
    resolver.stack.push(token)
    try {
      if (resolver.scope == InjectionScope.Container) {
        if (this.instanceCache.has(token)) {
          return this.instanceCache.get(token)
        }
        const instance = withResolver(resolver, instantiate)
        this.instanceCache.set(token, instance)
        return instance
      }
      else if (resolver.scope == InjectionScope.Resolution) {
        if (resolver.resolutions.has(token)) {
          return resolver.resolutions.get(token)
        }
        const instance = withResolver(resolver, instantiate)
        resolver.resolutions.set(token, instance)
        return instance
      }
      else if (resolver.scope == InjectionScope.Transient) {
        return withResolver(resolver, instantiate)
      }
    }
    finally {
      resolver.stack.pop()
      if (!resolver.stack.length) {
        resolver.resolutions.clear()
      }
    }
    expectNever(resolver.scope)
  }

  private createResolver(scope: InjectionScope | undefined): Resolver {
    const currentResolver = useResolver()
    let resolvedScope = scope || this.defaultScope
    if (resolvedScope == InjectionScope.Inherited) {
      resolvedScope = currentResolver?.scope || InjectionScope.Transient
    }
    if (currentResolver) {
      return {
        ...currentResolver,
        scope: resolvedScope,
      }
    }
    return {
      stack: [],
      dependents: new Map(),
      resolutions: new Map(),
      scope: resolvedScope,
      resolve: this.resolve,
    }
  }
}
