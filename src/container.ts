import {type InjectionConfig, isConfig} from './config'
import {createContext} from './create-context'
import {assert, ErrorMessage, expectNever} from './errors'
import {getMetadata} from './metadata'
import {
  getScope,
  isClassProvider,
  isFactoryProvider,
  isTokenProvider,
  isValueProvider,
  type Provider,
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
  readonly providerRegistry: Map<InjectionToken, Provider> = new Map()

  parent?: Container
  defaultScope: InjectionScope

  constructor(options?: ContainerOptions)
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
  register<T>(provider: Provider<T>): void
  register<T>(providable: Provider<T> | Constructor<T>): void {
    if (isConstructor(providable)) {
      const Class = providable
      const metadata = getMetadata(Class)
      const tokens = (metadata?.tokens || []).concat(Class)
      tokens.forEach((token) => {
        const provider = {
          token,
          useClass: Class,
          scope: metadata?.scope,
        }
        this.providerRegistry.set(token, provider)
      })
    }
    else {
      const provider = providable
      const token = provider.token
      this.providerRegistry.set(token, provider)
    }
  }

  resolve<T extends any[]>(config: InjectionConfig<T>): T[number]
  resolve<T>(token: InjectionToken<T>): T
  resolve<T>(resolvable: Resolvable<T>): T
  resolve<T>(resolvable: Resolvable<T>): T {
    if (isConfig(resolvable)) {
      const config = resolvable
      const tokens = config.tokens
      for (const token of tokens) {
        const provider = this.resolveProvider(token)
        if (provider) {
          const scope = config.scope
          return this.resolveInstance({...provider, ...(scope && {scope})})
        }
      }
      const tokenNames = tokens.map((token) => token.name).join(', ')
      assert(false, ErrorMessage.UnresolvableToken, tokenNames)
    }
    else {
      const token = resolvable
      const provider = this.resolveProvider(token)
      assert(provider, ErrorMessage.UnresolvableToken, token.name)
      return this.resolveInstance(provider)
    }
  }

  resolveProvider<T>(token: InjectionToken<T>): Provider<T> | undefined {
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

  resolveInstance<T>(provider: Provider<T>): T {
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

  private resolveScopedInstance<T>(provider: Provider<T>, instantiate: Instantiate<T>): T {
    const token = provider.token
    const scope = getScope(provider)
    const context = this.createResolutionContext(scope)
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
