import {type InjectionConfig, isConfigLike} from "./config";
import {assert, ErrorMessage, expectNever} from "./errors";
import type {Injection, Injections} from "./injection";
import {useInjectionContext, withInjectionContext} from "./injection-context";
import {getMetadata} from "./metadata";
import {
  type InjectionProvider,
  isClassProvider,
  isFactoryProvider,
  isProvider,
  isValueProvider,
  NullProvider,
  UndefinedProvider,
} from "./provider";
import {InjectionScope} from "./scope";
import {type Constructor, type InjectionToken, isConstructor, Type} from "./token";
import {Stack} from "./utils/stack";

const ProviderRegistry: typeof Map<InjectionToken, InjectionProvider> = Map;

const InstanceCache: typeof Map<InjectionToken, any> = Map;

export interface ContainerOptions {
  parent?: Container;
  defaultScope?: InjectionScope;
}

export class Container {
  #reservedRegistry = new ProviderRegistry([
    [Type.Any, null!],
    [Type.Null, NullProvider],
    [Type.Undefined, UndefinedProvider],
  ]);

  #providerRegistry = new ProviderRegistry();

  get unsafe_providerRegistry(): InstanceType<typeof ProviderRegistry> {
    return this.#providerRegistry;
  }

  #instanceCache = new InstanceCache();

  get unsafe_instanceCache(): InstanceType<typeof InstanceCache> {
    return this.#instanceCache;
  }

  parent?: Container;
  defaultScope: InjectionScope;

  constructor(options?: ContainerOptions);
  constructor({parent, defaultScope = InjectionScope.Inherited}: ContainerOptions = {}) {
    this.parent = parent;
    this.defaultScope = defaultScope;
    this.#reservedRegistry.set(Container, {token: Container, useValue: this});
  }

  createChild(): Container {
    return new Container({
      parent: this,
      defaultScope: this.defaultScope,
    });
  }

  clearCache(): void {
    this.#instanceCache.clear();
  }

  resetRegistry(): void {
    this.#instanceCache.clear();
    this.#providerRegistry.clear();
  }

  isRegistered<Value>(token: InjectionToken<Value>): boolean {
    return (
      this.#providerRegistry.has(token)
      || !!(this.parent?.isRegistered(token))
    );
  }

  #getProvider<Value>(token: InjectionToken<Value>) {
    return (
      this.#reservedRegistry.get(token)
      || this.#providerRegistry.get(token)
    );
  }

  #setProvider<Value>(token: InjectionToken<Value>, provider: InjectionProvider<Value>) {
    assert(!this.#reservedRegistry.has(token), ErrorMessage.ReservedToken, token.name);
    this.#providerRegistry.set(token, provider);
  }

  register<Instance extends object>(Class: Constructor<Instance>): void;
  register<Value>(provider: InjectionProvider<Value>): void;
  register<Value>(providable: Constructor<Value & object> | InjectionProvider<Value>): void {
    if (isConstructor(providable)) {
      const Class = providable;
      const metadata = getMetadata(Class);
      const tokens = [Class, ...(metadata?.tokens || [])];
      tokens.forEach((token) => {
        const provider = {
          token,
          useClass: Class,
          scope: metadata?.scope,
        };
        this.#setProvider(token, provider);
      });
    }
    else {
      const provider = providable;
      const token = provider.token;
      this.#setProvider(token, provider);
    }
  }

  resolve<Values extends unknown[]>(...injections: Injections<Values>): Values[number];
  resolve<Value>(...injections: Injection<Value>[]): Value {
    for (const injection of injections) {
      if (isConfigLike(injection)) {
        if (isProvider(injection)) {
          const provider = injection;
          return this.resolveValue(provider);
        }
        const config = injection;
        const token = config.token;
        const provider = this.resolveProvider(token);
        if (provider) {
          const scope = config.scope;
          return this.resolveValue({...provider, ...(scope && {scope})});
        }
      }
      else {
        const token = injection;
        const provider = this.resolveProvider(token);
        if (provider) {
          return this.resolveValue(provider);
        }
      }
    }
    const tokenNames = injections.map((injection) => {
      if (isConfigLike(injection)) {
        const config = injection;
        const token = config.token;
        return token.name;
      }
      const token = injection;
      return token.name;
    });
    const formatter = new Intl.ListFormat("en", {style: "narrow", type: "conjunction"});
    assert(false, ErrorMessage.UnresolvableToken, formatter.format(tokenNames));
  }

  resolveProvider<Value>(token: InjectionToken<Value>): InjectionProvider<Value> | undefined {
    if (isConstructor(token)) {
      const Class = token;
      const provider = this.#getProvider(token);
      if (provider) {
        return provider;
      }
      const metadata = getMetadata(Class);
      return {
        token,
        useClass: Class,
        scope: metadata?.scope,
      };
    }
    else {
      const provider = this.#getProvider(token);
      if (provider) {
        return provider;
      }
    }
  }

  resolveValue<Value>(provider: InjectionProvider<Value>): Value {
    if (isClassProvider(provider)) {
      const Class = provider.useClass;
      return this.#resolveScopedInstance(provider, () => new Class());
    }
    else if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.#resolveScopedInstance(provider, factory);
    }
    else if (isValueProvider(provider)) {
      const value = provider.useValue;
      return value;
    }
    expectNever(provider);
  }

  #resolveScopedInstance<T>({token, scope = this.defaultScope}: InjectionConfig<T>, instantiate: () => T): T {
    const context = useInjectionContext();

    if (!context || context.container != this) {
      return withInjectionContext({
        container: this,
        resolution: {
          stack: new Stack(),
          instances: new Map(),
          dependents: new Map(),
        },
      }, () => this.#resolveScopedInstance({token, scope}, instantiate));
    }

    const resolution = context.resolution;

    if (resolution.stack.has(token)) {
      if (resolution.dependents.has(token)) {
        return resolution.dependents.get(token);
      }
      assert(false, ErrorMessage.CircularDependency, token.name);
    }

    let resolvedScope = scope;
    if (resolvedScope == InjectionScope.Inherited) {
      const dependentFrame = resolution.stack.peek();
      resolvedScope = dependentFrame?.scope || InjectionScope.Transient;
    }

    resolution.stack.push(token, {token, scope: resolvedScope});
    try {
      if (resolvedScope == InjectionScope.Container) {
        if (this.#instanceCache.has(token)) {
          return this.#instanceCache.get(token);
        }
        const instance = instantiate();
        this.#instanceCache.set(token, instance);
        return instance;
      }
      else if (resolvedScope == InjectionScope.Resolution) {
        if (resolution.instances.has(token)) {
          return resolution.instances.get(token);
        }
        const instance = instantiate();
        resolution.instances.set(token, instance);
        return instance;
      }
      else if (resolvedScope == InjectionScope.Transient) {
        return instantiate();
      }
      expectNever(resolvedScope);
    }
    finally {
      resolution.stack.pop();
    }
  }
}
