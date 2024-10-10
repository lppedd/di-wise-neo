import {type InjectionConfig, isConfigLike} from './config'
import {createContext} from './create-context'
import {assert, ErrorMessage, expectNever} from './errors'
import {getMetadata} from './metadata'
import {
  type InjectionProvider,
  isClassProvider,
  isFactoryProvider,
  isTokenProvider,
  isValueProvider,
} from './provider'
import {
  type Instantiate,
  type ResolutionContext,
  useResolutionContext,
  withResolutionContext,
} from './resolution-context'
import type {Resolvable} from './resolvable'
import {InjectionScope} from './scope'
import {type Constructor, type InjectionToken, isConstructor} from './token'

export interface ContainerOptions {
  parent?: Container
  defaultScope?: InjectionScope
}

export class Container {
  readonly instanceCache: Map<InjectionToken, any> = new Map()
  readonly providerRegistry: Map<InjectionToken, InjectionProvider> = new Map()

  parent?: Container
  defaultScope: InjectionScope

  constructor({parent, defaultScope = InjectionScope.Inherited}: ContainerOptions = {}) {
    this.parent = parent
    this.defaultScope = defaultScope
    this.register({token: Container, useValue: this})
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

  register<T>(Class: Constructor<T>): void
  register<T>(provider: InjectionProvider<T>): void
  register<T>(providable: InjectionProvider<T> | Constructor<T>): void {
    let provider: InjectionProvider<T>
    if (isConstructor(providable)) {
      const Class = providable
      const metadata = getMetadata(Class)
      const token = metadata?.token || Class
      provider = {
        token,
        useClass: Class,
        scope: metadata?.scope,
      }
    }
    else {
      provider = providable
    }
    const token = provider.token
    this.providerRegistry.set(token, provider)
  }

  resolve = <T>(resolvable: Resolvable<T>): T => {
    let token: InjectionToken<T>
    let provider: InjectionProvider<T> | undefined
    if (isConfigLike(resolvable)) {
      const config = resolvable
      token = config.token
      provider = this.resolveProvider(token)
      if (provider && config.scope) {
        provider = Object.assign({}, provider, config)
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
      return withContainer(this, () =>
        this.resolveScopedInstance(provider, (context) => {
          const instance = new Class()
          const metadata = getMetadata(Class)
          if (metadata?.dependencies) {
            const token = provider.token
            context.dependents.set(token, instance)
            try {
              metadata.dependencies.forEach((dependency) => {
                const value = this.resolve(dependency.resolvable)
                dependency.setValue(instance, value)
              })
            }
            finally {
              context.dependents.delete(token)
            }
          }
          return instance
        }),
      )
    }
    else if (isFactoryProvider(provider)) {
      const factory = provider.useFactory
      return withContainer(this, () =>
        this.resolveScopedInstance(provider, (_context) => factory()),
      )
    }
    else if (isTokenProvider(provider)) {
      const forwardedToken = provider.useToken
      return this.resolve(forwardedToken)
    }
    else if (isValueProvider(provider)) {
      const value = provider.useValue
      return value
    }
    expectNever(provider)
  }

  private resolveScopedInstance<T>(config: InjectionConfig<T>, instantiate: Instantiate<T>): T {
    const token = config.token
    const context = this.createResolutionContext(config.scope)
    if (context.stack.includes(token)) {
      if (context.dependents.has(token)) {
        return context.dependents.get(token)
      }
      assert(false, ErrorMessage.CircularDependency, token.name)
    }
    context.stack.push(token)
    try {
      if (context.scope == InjectionScope.Container) {
        if (this.instanceCache.has(token)) {
          return this.instanceCache.get(token)
        }
        const instance = withResolutionContext(context, instantiate)
        this.instanceCache.set(token, instance)
        return instance
      }
      else if (context.scope == InjectionScope.Resolution) {
        if (context.instances.has(token)) {
          return context.instances.get(token)
        }
        const instance = withResolutionContext(context, instantiate)
        context.instances.set(token, instance)
        return instance
      }
      else if (context.scope == InjectionScope.Transient) {
        return withResolutionContext(context, instantiate)
      }
    }
    finally {
      context.stack.pop()
      if (!context.stack.length) {
        context.instances.clear()
      }
    }
    expectNever(context.scope)
  }

  private createResolutionContext(scope = this.defaultScope): ResolutionContext {
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
      scope: resolvedScope,
      stack: [],
      instances: new Map(),
      dependents: new Map(),
    }
  }
}

/** @internal */
export const [withContainer, useContainer] = createContext<Container>()
