import {assert, ErrorMessage, expectNever} from "./errors";
import {useInjectionContext, withInjectionContext} from "./injection-context";
import {getMetadata, getRegistration} from "./metadata";
import {
  isClassProvider,
  isFactoryProvider,
  isValueProvider,
  type Provider,
} from "./provider";
import {type Options, type Registration, Registry} from "./registry";
import {Scope} from "./scope";
import {type Constructor, isConstructor, type Token, type TokenList} from "./token";
import {KeyedStack} from "./utils/keyed-stack";

export interface ContainerOptions {
  parent?: Container;
  defaultScope?: Scope;
  autoRegister?: boolean;
}

export class Container {
  readonly parent?: Container;
  readonly registry: Registry;

  defaultScope: Scope;
  autoRegister: boolean;

  constructor(options?: ContainerOptions);
  constructor({
    parent,
    autoRegister = false,
    defaultScope = Scope.Inherited,
  }: ContainerOptions = {}) {
    this.parent = parent;
    this.registry = new Registry(parent?.registry);
    this.autoRegister = autoRegister;
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

  isRegistered<Value>(token: Token<Value>): boolean {
    return this.registry.has(token);
  }

  register<Instance extends object>(Class: Constructor<Instance>): this;
  register<Value>(token: Token<Value>, provider: Provider<Value>, options?: Options): this;
  register<Value>(
    ...args:
      | [Constructor<Value & object>]
      | [Token<Value>, Provider<Value>, Options?]
  ): this {
    if (args.length == 1) {
      const [Class] = args;
      const metadata = getMetadata(Class);
      const tokens = [Class, ...(metadata.tokens || [])];
      tokens.forEach((token) => {
        const registration = getRegistration(metadata);
        this.registry.set(token, registration);
      });
    }
    else {
      const [token] = args;
      let [, provider, options] = args;
      if (isClassProvider(provider)) {
        const Class = provider.useClass;
        const metadata = getMetadata(Class);
        provider = metadata.provider;
        options = {
          scope: metadata.scope,
          ...options,
        };
      }
      this.registry.set(token, {provider, options});
    }
    return this;
  }

  unregister<Value>(token: Token<Value>): this {
    this.registry.delete(token);
    return this;
  }

  resolve<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];
  resolve<Value>(...tokens: Token<Value>[]): Value {
    for (const token of tokens) {
      const registration = this.registry.get(token);
      if (registration) {
        return this.resolveValue(registration);
      }
      if (isConstructor(token)) {
        const Class = token;
        const metadata = getMetadata(Class);
        if (metadata.autoRegister ?? this.autoRegister) {
          this.register(Class);
          return this.resolve(Class);
        }
        const registration = getRegistration(metadata);
        return this.resolveValue(registration);
      }
    }
    this.throwUnresolvableError(tokens);
  }

  resolveAll<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number][];
  resolveAll<Value>(...tokens: Token<Value>[]): Value[] {
    for (const token of tokens) {
      const registrations = this.registry.getAll(token);
      if (registrations) {
        return registrations.map((registration) =>
          this.resolveValue(registration),
        );
      }
      if (isConstructor(token)) {
        const Class = token;
        const metadata = getMetadata(Class);
        if (metadata.autoRegister ?? this.autoRegister) {
          this.register(Class);
          return [this.resolve(Class)];
        }
        const registration = getRegistration(metadata);
        return [this.resolveValue(registration)];
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
          stack: new KeyedStack(),
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

    let resolvedScope = registration.options?.scope || this.defaultScope;
    if (resolvedScope == Scope.Inherited) {
      const dependentFrame = context.resolution.stack.peek();
      resolvedScope = dependentFrame?.scope || Scope.Transient;
    }

    context.resolution.stack.push(registration.provider, {
      provider: registration.provider,
      scope: resolvedScope,
    });
    try {
      if (resolvedScope == Scope.Container) {
        if (registration.cache) {
          return registration.cache.current;
        }
        const instance = instantiate();
        registration.cache = {current: instance};
        return instance;
      }
      else if (resolvedScope == Scope.Resolution) {
        if (context.resolution.instances.has(registration.provider)) {
          return context.resolution.instances.get(registration.provider);
        }
        const instance = instantiate();
        context.resolution.instances.set(registration.provider, instance);
        return instance;
      }
      else if (resolvedScope == Scope.Transient) {
        return instantiate();
      }
      expectNever(resolvedScope);
    }
    finally {
      context.resolution.stack.pop();
    }
  }

  private throwUnresolvableError(tokens: Token[]): never {
    const tokenNames = tokens.map((token) => token.name);
    const formatter = new Intl.ListFormat("en", {style: "narrow"});
    assert(false, ErrorMessage.UnresolvableToken, formatter.format(tokenNames));
  }
}
