import {isConfig} from './config'
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
import type {Resolvables} from './resolvable'
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
    // TODO: use separate registry
    this.register<Container>({token: Container, useValue: this})
  }

  createChild(): Container {
    return new Container({
      parent: this,
      defaultScope: this.defaultScope,
    })
  }

  isRegistered<Value>(token: InjectionToken<Value>): boolean {
    return (
      this.providerRegistry.has(token)
      || !!(this.parent?.isRegistered(token))
    )
  }

  register<Instance extends object>(Class: Constructor<Instance>): void
  register<Value>(provider: Provider<Value>): void
  register<Value>(providable: Provider<Value> | Constructor<Value & object>): void {
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

  resolve<Values extends unknown[]>(...resolvables: Resolvables<Values>): Values[number] {
    for (const resolvable of resolvables) {
      if (isConfig(resolvable)) {
        const config = resolvable
        const token = config.token
        const provider = this.resolveProvider(token)
        if (provider) {
          const scope = config.scope
          return this.resolveInstance({...provider, ...(scope && {scope})})
        }
      }
      else {
        const token = resolvable
        const provider = this.resolveProvider(token)
        if (provider) {
          return this.resolveInstance(provider)
        }
      }
    }
    const tokenNames = resolvables.map((resolvable) => {
      if (isConfig(resolvable)) {
        const config = resolvable
        const token = config.token
        return token.name
      }
      const token = resolvable
      return token.name
    })
    assert(false, ErrorMessage.UnresolvableToken, tokenNames.join(', '))
  }

  resolveProvider<Value>(token: InjectionToken<Value>): Provider<Value> | undefined {
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

  // TODO: rename to resolveValue
  resolveInstance<Value>(provider: Provider<Value>): Value {
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
                const value = this.resolve(...dependency.resolvables)
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
