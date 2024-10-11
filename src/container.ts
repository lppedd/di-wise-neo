import {isConfigLike} from './config'
import {createContext} from './create-context'
import {assert, ErrorMessage, expectNever} from './errors'
import type {Injections} from './injection'
import {getMetadata} from './metadata'
import {
  type InjectionProvider,
  isClassProvider,
  isFactoryProvider,
  isProvider,
  isValueProvider,
  type ScopedProvider,
} from './provider'
import {
  type Instantiate,
  type ResolutionContext,
  useResolutionContext,
  withResolutionContext,
} from './resolution-context'
import {InjectionScope} from './scope'
import {type Constructor, type InjectionToken, isConstructor, Type} from './token'

export interface ContainerOptions {
  parent?: Container
  defaultScope?: InjectionScope
}

export class Container {
  #reservedRegistry = new Map<InjectionToken, InjectionProvider>([
    [Type.Any, null!],
    [Type.Null, {token: Type.Null, useValue: null}],
    [Type.Undefined, {token: Type.Undefined, useValue: void 0}],
  ])

  /** @deprecated unsafe */
  providerRegistry: Map<InjectionToken, InjectionProvider> = new Map()

  /** @deprecated unsafe */
  instanceCache: Map<InjectionToken, any> = new Map()

  parent?: Container
  defaultScope: InjectionScope

  constructor(options?: ContainerOptions)
  constructor({parent, defaultScope = InjectionScope.Inherited}: ContainerOptions = {}) {
    this.parent = parent
    this.defaultScope = defaultScope
    this.#reservedRegistry.set(Container, {token: Container, useValue: this})
  }

  createChild(): Container {
    return new Container({
      parent: this,
      defaultScope: this.defaultScope,
    })
  }

  clearCache(): void {
    this.instanceCache.clear()
  }

  resetRegistry(): void {
    this.instanceCache.clear()
    this.providerRegistry.clear()
  }

  isRegistered<Value>(token: InjectionToken<Value>): boolean {
    return (
      this.providerRegistry.has(token)
      || !!(this.parent?.isRegistered(token))
    )
  }

  #getProvider<Value>(token: InjectionToken<Value>): InjectionProvider<Value> | null | undefined {
    return (
      this.#reservedRegistry.get(token)
      || this.providerRegistry.get(token)
    )
  }

  #setProvider<Value>(token: InjectionToken<Value>, provider: InjectionProvider<Value>): void {
    assert(!this.#reservedRegistry.has(token), ErrorMessage.ReservedToken, token.name)
    this.providerRegistry.set(token, provider)
  }

  register<Instance extends object>(Class: Constructor<Instance>): void
  register<Value>(provider: InjectionProvider<Value>): void
  register<Value>(providable: InjectionProvider<Value> | Constructor<Value & object>): void {
    if (isConstructor(providable)) {
      const Class = providable
      const metadata = getMetadata(Class)
      const tokens = [Class, ...(metadata?.tokens || [])]
      tokens.forEach((token) => {
        const provider = {
          token,
          useClass: Class,
          scope: metadata?.scope,
        }
        this.#setProvider(token, provider)
      })
    }
    else {
      const provider = providable
      const token = provider.token
      this.#setProvider(token, provider)
    }
  }

  resolve<Values extends unknown[]>(...injections: Injections<Values>): Values[number] {
    for (const injection of injections) {
      if (isConfigLike(injection)) {
        if (isProvider(injection)) {
          const provider = injection
          return this.resolveValue(provider)
        }
        const config = injection
        const token = config.token
        const provider = this.resolveProvider(token)
        if (provider) {
          const scope = config.scope
          return this.resolveValue({...provider, ...(scope && {scope})})
        }
      }
      else {
        const token = injection
        const provider = this.resolveProvider(token)
        if (provider) {
          return this.resolveValue(provider)
        }
      }
    }
    const tokenNames = injections.map((injection) => {
      if (isConfigLike(injection)) {
        const config = injection
        const token = config.token
        return token.name
      }
      const token = injection
      return token.name
    })
    assert(false, ErrorMessage.UnresolvableToken, tokenNames.join(', '))
  }

  resolveProvider<Value>(token: InjectionToken<Value>): InjectionProvider<Value> | undefined {
    if (isConstructor(token)) {
      const Class = token
      const provider = this.#getProvider(token)
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
      const provider = this.#getProvider(token)
      if (provider) {
        return provider
      }
      return this.parent?.resolveProvider(token)
    }
  }

  resolveValue<Value>(provider: InjectionProvider<Value>): Value {
    if (isClassProvider(provider)) {
      const Class = provider.useClass
      return withContainer(this, () =>
        this.#resolveScopedInstance(provider, (context) => {
          const instance = new Class()
          const metadata = getMetadata(Class)
          if (metadata?.dependencies) {
            const token = provider.token
            context.dependents.set(token, instance)
            try {
              metadata.dependencies.forEach((dependency) => {
                const value = this.resolve(...dependency.injections)
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
        this.#resolveScopedInstance(provider, (_context) => factory()),
      )
    }
    else if (isValueProvider(provider)) {
      const value = provider.useValue
      return value
    }
    expectNever(provider)
  }

  #resolveScopedInstance<T>(provider: ScopedProvider<T>, instantiate: Instantiate<T>): T {
    const token = provider.token
    const context = this.#createResolutionContext(provider.scope)
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

  #createResolutionContext(scope = this.defaultScope): ResolutionContext {
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
