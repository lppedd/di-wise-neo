import {assert, ErrorMessage, expectNever} from "./errors";
import {useInjectionContext, withInjectionContext} from "./injection-context";
import {getMetadata} from "./metadata";
import {
  type InjectionProvider,
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
} from "./provider";
import {type Registration, Registry} from "./registry";
import {InjectionScope} from "./scope";
import {type Constructor, type InjectionToken, type InjectionTokens, isConstructor} from "./token";
import {Stack} from "./utils/stack";

export interface ContainerOptions {
  parent?: Container;
  defaultScope?: InjectionScope;
}

export class Container {
  readonly registry: Registry;

  defaultScope: InjectionScope;

  constructor(options?: ContainerOptions);
  constructor({parent, defaultScope = InjectionScope.Inherited}: ContainerOptions = {}) {
    this.registry = new Registry(parent?.registry);
    this.defaultScope = defaultScope;
  }

  createChild(): Container {
    return new Container({
      parent: this,
      defaultScope: this.defaultScope,
    });
  }

  clearCache(): void {
    for (const registration of this.registry.values()) {
      registration.cache &&= undefined;
    }
  }

  resetRegistry(): void {
    this.registry.clear();
  }

  isRegistered<Value>(token: InjectionToken<Value>): boolean {
    return this.registry.has(token);
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
        this.registry.set(token, {provider});
      });
    }
    else {
      const provider = providable;
      const {token} = provider;
      this.registry.set(token, {provider});
    }
  }

  resolve<Values extends unknown[]>(...tokens: InjectionTokens<Values>): Values[number];
  resolve<Value>(...tokens: InjectionToken<Value>[]): Value {
    for (const token of tokens) {
      const registration = this.registry.get(token);
      if (registration) {
        return this.resolveValue(registration);
      }
      if (isConstructor(token)) {
        const Class = token;
        const metadata = getMetadata(Class);
        const provider = {
          token,
          useClass: Class,
          scope: metadata?.scope,
        };
        return this.resolveValue({provider});
      }
    }
    const tokenNames = tokens.map((token) => token.name);
    const formatter = new Intl.ListFormat("en", {style: "narrow"});
    assert(false, ErrorMessage.UnresolvableToken, formatter.format(tokenNames));
  }

  private resolveValue<Value>(registration: Registration<Value>): Value {
    const {provider} = registration;
    if (isClassProvider(provider)) {
      const Class = provider.useClass;
      return this.resolveScopedInstance(registration, () => new Class());
    }
    else if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.resolveScopedInstance(registration, factory);
    }
    else if (isValueProvider(provider)) {
      const value = provider.useValue;
      return value;
    }
    expectNever(provider);
  }

  private resolveScopedInstance<T>(registration: Registration<T>, instantiate: () => T): T {
    const context = useInjectionContext();

    if (!context || context.container != this) {
      return withInjectionContext({
        container: this,
        resolution: {
          stack: new Stack(),
          instances: new Map(),
          dependents: new Map(),
        },
      }, () => this.resolveScopedInstance(registration, instantiate));
    }

    const {token, scope = this.defaultScope} = registration.provider;

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
        if (registration.cache) {
          return registration.cache.current;
        }
        const instance = instantiate();
        registration.cache = {current: instance};
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
