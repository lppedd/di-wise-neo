import type { Container } from "./container";
import type { ContainerOptions } from "./containerOptions";
import { assert, expectNever } from "./errors";
import { createResolution, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { getMetadata } from "./metadata";
import { isClassProvider, isFactoryProvider, isValueProvider, type Provider } from "./provider";
import { isBuilder, type Registration, type RegistrationOptions, Registry } from "./registry";
import { Scope } from "./scope";
import { type Constructor, isConstructor, type Token } from "./token";

/**
 * The default implementation of a di-wise {@link Container}.
 */
export class DefaultContainer implements Container {
  private readonly options: ContainerOptions;

  readonly registry: Registry;

  constructor(options: Partial<ContainerOptions>) {
    this.options = {
      autoRegister: false,
      defaultScope: Scope.Inherited,
      ...options,
    };

    this.registry = new Registry(this.options.parent?.registry);
  }

  createChild(): Container {
    return new DefaultContainer({
      ...this.options,
      parent: this,
    });
  }

  clearCache(): void {
    for (const registrations of this.registry.map.values()) {
      for (let i = 0; i < registrations.length; i++) {
        const registration = registrations[i]!;
        registrations[i] = {
          options: registration.options,
          provider: registration.provider,
        };
      }
    }
  }

  getCached<Value>(token: Token<Value>): Value | undefined {
    const registration = this.registry.get(token);
    return registration?.instance?.current;
  }

  isRegistered(token: Token): boolean {
    return !!this.registry.get(token);
  }

  resetRegistry(): void {
    this.registry.map.clear();
  }

  unregister(token: Token): this {
    this.registry.map.delete(token);
    return this;
  }

  register<T>(
    ...args: [Constructor<T & object>] | [Token<T>, Provider<T>, RegistrationOptions?]
  ): this {
    if (args.length == 1) {
      const [Class] = args;
      const metadata = getMetadata(Class);
      const tokens = [Class, ...metadata.tokens];

      for (const token of tokens) {
        this.registry.set(token, {
          provider: metadata.provider,
          options: { scope: metadata.scope },
        });
      }
    } else {
      const [token, provider, options] = args;

      if (isClassProvider(provider)) {
        const Class = provider.useClass;
        const metadata = getMetadata(Class);
        this.registry.set(token, {
          provider: metadata.provider,
          options: { scope: metadata.scope, ...options },
        });
      } else {
        this.registry.set(token, { provider, options });
      }
    }

    return this;
  }

  resolve<T>(...tokens: Token<T>[]): T {
    for (const token of tokens) {
      const registration = this.registry.get(token);

      if (registration) {
        return this.instantiateProvider(registration);
      }

      if (isConstructor(token)) {
        return this.instantiateClass(token);
      }
    }

    this.throwUnregisteredError(tokens);
  }

  resolveAll<T>(...tokens: Token<T>[]): NonNullable<T>[] {
    for (const token of tokens) {
      const registrations = this.registry.getAll(token);

      if (registrations) {
        return registrations
          .map((registration) => this.instantiateProvider(registration))
          .filter((instance) => instance != null);
      }

      if (isConstructor(token)) {
        return [this.instantiateClass(token)];
      }
    }

    this.throwUnregisteredError(tokens);
  }

  private instantiateClass<T extends object>(Class: Constructor<T>): T {
    const metadata = getMetadata(Class);

    if (metadata.autoRegister ?? this.options.autoRegister) {
      this.register(Class);
      return (this as Container).resolve(Class);
    }

    const provider = metadata.provider;
    const options = { scope: this.resolveScope(metadata.scope) };
    assert(
      options.scope != Scope.Container,
      `unregistered class ${Class.name} cannot be resolved in container scope`,
    );

    return this.resolveScopedInstance({ provider, options }, () => new Class());
  }

  private instantiateProvider<T>(registration: Registration<T>): T {
    const provider = registration.provider;

    if (isClassProvider(provider)) {
      const Class = provider.useClass;
      return this.resolveScopedInstance(registration, () => new Class());
    }

    if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.resolveScopedInstance(registration, factory);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    expectNever(provider);
  }

  private resolveScopedInstance<T>(registration: Registration<T>, instantiate: () => T): T {
    let context = useInjectionContext();

    if (!context || context.container !== this) {
      context = {
        container: this,
        resolution: createResolution(),
      };
    }

    const resolution = context.resolution;
    const provider = registration.provider;
    const options = registration.options;

    if (resolution.stack.has(provider)) {
      const dependentRef = resolution.dependents.get(provider);
      assert(dependentRef, "circular dependency detected");
      return dependentRef.current;
    }

    const scope = this.resolveScope(options?.scope, context);
    const cleanups = [
      provideInjectionContext(context),
      !isBuilder(provider) && resolution.stack.push(provider, { provider, scope }),
    ];

    try {
      if (scope == Scope.Container) {
        const instanceRef = registration.instance;

        if (instanceRef) {
          return instanceRef.current;
        }

        const instance = instantiate();
        registration.instance = { current: instance };
        return instance;
      }

      if (scope == Scope.Resolution) {
        const instanceRef = resolution.instances.get(provider);

        if (instanceRef) {
          return instanceRef.current;
        }

        const instance = instantiate();
        resolution.instances.set(provider, { current: instance });
        return instance;
      }

      if (scope == Scope.Transient) {
        return instantiate();
      }

      expectNever(scope);
    } finally {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    }
  }

  private resolveScope(
    scope = this.options.defaultScope,
    context = useInjectionContext(),
  ): "Transient" | "Resolution" | "Container" {
    if (scope == Scope.Inherited) {
      const dependentFrame = context?.resolution.stack.peek();
      return dependentFrame?.scope || Scope.Transient;
    }

    return scope;
  }

  private throwUnregisteredError(tokens: Token[]): never {
    const tokenNames = tokens.map((token) => token.name);
    assert(false, `unregistered token ${tokenNames.join(", ")}`);
  }
}
