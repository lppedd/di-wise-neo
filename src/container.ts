import {assert, ErrorMessage, expectNever} from "./errors";
import {useInjectionContext, withInjectionContext} from "./injection-context";
import {getMetadata} from "./metadata";
import {
  getProvider,
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
  readonly parent?: Container;
  readonly registry: Registry;

  defaultScope: InjectionScope;

  constructor(options?: ContainerOptions);
  constructor({parent, defaultScope = InjectionScope.Inherited}: ContainerOptions = {}) {
    this.parent = parent;
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
    for (const registrations of this.registry.values()) {
      registrations.forEach(({provider}, i) => {
        registrations[i] = {provider};
      });
    }
  }

  resetRegistry(): void {
    this.registry.clear();
  }

  isRegistered<Value>(token: InjectionToken<Value>): boolean {
    return this.registry.has(token);
  }

  register<Instance extends object>(Class: Constructor<Instance>): this;
  register<Value>(token: InjectionToken<Value>, provider: InjectionProvider<Value>): this;
  register<Value>(
    ...args:
      | [Class: Constructor<Value & object>]
      | [token: InjectionToken<Value>, provider: InjectionProvider<Value>]
  ): this {
    if (args.length == 1) {
      const [Class] = args;
      const metadata = getMetadata(Class);
      const tokens = [Class, ...(metadata?.tokens || [])];
      tokens.forEach((token) => {
        const provider = getProvider(Class);
        this.registry.set(token, {provider});
      });
    }
    else {
      const [token, provider] = args;
      this.registry.set(token, {provider});
    }
    return this;
  }

  unregister<Value>(token: InjectionToken<Value>): this {
    this.registry.delete(token);
    return this;
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
        const provider = getProvider(Class);
        return this.resolveValue({provider});
      }
    }
    this.throwUnresolvableError(tokens);
  }

  resolveAll<Values extends unknown[]>(...tokens: InjectionTokens<Values>): Values[number][];
  resolveAll<Value>(...tokens: InjectionToken<Value>[]): Value[] {
    for (const token of tokens) {
      const registrations = this.registry.getAll(token);
      if (registrations) {
        return registrations.map((registration) =>
          this.resolveValue(registration),
        );
      }
      if (isConstructor(token)) {
        const Class = token;
        const provider = getProvider(Class);
        return [this.resolveValue({provider})];
      }
    }
    this.throwUnresolvableError(tokens);
  }

  private resolveValue<Value>(registration: Registration<Value>): Value {
    if (isClassProvider(registration.provider)) {
      const Class = registration.provider.useClass;
      return this.resolveScopedInstance(registration, () => new Class());
    }
    else if (isFactoryProvider(registration.provider)) {
      const factory = registration.provider.useFactory;
      return this.resolveScopedInstance(registration, factory);
    }
    else if (isValueProvider(registration.provider)) {
      const value = registration.provider.useValue;
      return value;
    }
    expectNever(registration.provider);
  }

  private resolveScopedInstance<T>(registration: Registration<T>, instantiate: () => T): T {
    const context = useInjectionContext();

    if (!context || context.container !== this) {
      return withInjectionContext({
        container: this,
        resolution: {
          stack: new Stack(),
          instances: new Map(),
          dependents: new Map(),
        },
      }, () => this.resolveScopedInstance(registration, instantiate));
    }

    if (context.resolution.stack.has(registration.provider)) {
      if (context.resolution.dependents.has(registration.provider)) {
        return context.resolution.dependents.get(registration.provider);
      }
      assert(false, ErrorMessage.CircularDependency);
    }

    let resolvedScope = registration.provider.scope || this.defaultScope;
    if (resolvedScope == InjectionScope.Inherited) {
      const dependentFrame = context.resolution.stack.peek();
      resolvedScope = dependentFrame?.scope || InjectionScope.Transient;
    }

    context.resolution.stack.push(registration.provider, {
      provider: registration.provider,
      scope: resolvedScope,
    });
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
        if (context.resolution.instances.has(registration.provider)) {
          return context.resolution.instances.get(registration.provider);
        }
        const instance = instantiate();
        context.resolution.instances.set(registration.provider, instance);
        return instance;
      }
      else if (resolvedScope == InjectionScope.Transient) {
        return instantiate();
      }
      expectNever(resolvedScope);
    }
    finally {
      context.resolution.stack.pop();
    }
  }

  private throwUnresolvableError(tokens: InjectionToken<any>[]): never {
    const tokenNames = tokens.map((token) => token.name);
    const formatter = new Intl.ListFormat("en", {style: "narrow"});
    assert(false, ErrorMessage.UnresolvableToken, formatter.format(tokenNames));
  }
}
