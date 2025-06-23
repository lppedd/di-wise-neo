import type { Container, ContainerOptions } from "./container";
import {
  assert,
  expectNever,
  throwExistingUnregisteredError,
  throwNoTokensProvidedError,
  throwUnregisteredError,
} from "./errors";
import { createResolution, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { getMetadata } from "./metadata";
import {
  type ExistingProvider,
  isClassProvider,
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
  type Provider,
} from "./provider";
import { isBuilder, type Registration, type RegistrationOptions, Registry } from "./registry";
import { Scope } from "./scope";
import { type Constructor, isConstructor, type Token } from "./token";
import { isDisposable } from "./utils/disposable";

/**
 * The default implementation of a di-wise {@link Container}.
 */
export class DefaultContainer implements Container {
  // eslint-disable-next-line no-use-before-define
  private readonly myChildren: Set<DefaultContainer> = new Set();
  private readonly myOptions: ContainerOptions;
  private readonly myRegistry: Registry;
  private myDisposed: boolean = false;

  constructor(
    private readonly myParent: DefaultContainer | undefined,
    options: Partial<ContainerOptions>,
  ) {
    this.myOptions = {
      autoRegister: false,
      defaultScope: Scope.Inherited,
      ...options,
    };

    this.myRegistry = new Registry(this.myParent?.registry);
  }

  get registry(): Registry {
    return this.myRegistry;
  }

  get isDisposed(): boolean {
    return this.myDisposed;
  }

  getParent(): Container | undefined {
    return this.myParent;
  }

  createChild(): Container {
    this.checkDisposed();
    const container = new DefaultContainer(this, {
      ...this.myOptions,
    });

    this.myChildren.add(container);
    return container;
  }

  clearCache(): unknown[] {
    this.checkDisposed();
    const values = new Set<unknown>();

    for (const registrations of this.registry.map.values()) {
      for (let i = 0; i < registrations.length; i++) {
        const registration = registrations[i]!;
        const value = registration.value;

        if (value) {
          values.add(value.current);
        }

        registrations[i] = {
          provider: registration.provider,
          options: registration.options,
        };
      }
    }

    return Array.from(values);
  }

  getCached<T>(token: Token<T>): T | undefined {
    this.checkDisposed();
    const registration = this.registry.get(token);
    return registration?.value?.current;
  }

  getAllCached<T>(token: Token<T>): T[] {
    this.checkDisposed();
    const registrations = this.registry.getAll(token);

    if (!registrations) {
      return [];
    }

    const values = new Set<T>();

    for (const registration of registrations) {
      const value = registration.value;

      if (value) {
        values.add(value.current);
      }
    }

    return Array.from(values);
  }

  resetRegistry(): unknown[] {
    this.checkDisposed();
    const registrations = this.registry.deleteAll();
    const values = new Set<unknown>();

    for (const registration of registrations) {
      const value = registration.value;

      if (value) {
        values.add(value.current);
      }
    }

    return Array.from(values);
  }

  isRegistered(token: Token): boolean {
    this.checkDisposed();
    return !!this.registry.get(token);
  }

  register<T>(
    ...args: [Constructor<T & object>] | [Token<T>, Provider<T>, RegistrationOptions?]
  ): this {
    this.checkDisposed();

    if (args.length == 1) {
      const Class = args[0];
      const metadata = getMetadata(Class);

      // Register the class itself
      this.registry.set(Class, {
        // The provider is of type ClassProvider, initialized by getMetadata
        provider: metadata.provider,
        options: {
          scope: metadata.scope,
        },
      });

      // Register the additional tokens specified via class decorators.
      // These tokens will point to the original Class token, and will have the same scope.
      for (const token of metadata.tokens) {
        this.registry.set(token, {
          provider: {
            useExisting: Class,
          },
          options: {
            scope: metadata.scope,
          },
        });
      }
    } else {
      const [token, provider, options] = args;

      if (isClassProvider(provider)) {
        const Class = provider.useClass;
        const metadata = getMetadata(Class);
        this.registry.set(token, {
          provider: metadata.provider,
          options: {
            // The explicit registration options override what is specified
            // via class decorators (e.g., @Scoped)
            scope: metadata.scope,
            ...options,
          },
        });
      } else {
        if (isExistingProvider(provider)) {
          assert(
            token !== provider.useExisting,
            `the useExisting token ${token.name} cannot be the same as the token being registered`,
          );
        }

        this.registry.set(token, {
          provider: provider,
          options: options,
        });
      }
    }

    return this;
  }

  unregister<T>(token: Token<T>): T[] {
    this.checkDisposed();
    const registrations = this.registry.delete(token);

    if (!registrations) {
      return [];
    }

    const values = new Set<T>();

    for (const registration of registrations) {
      const value = registration.value;

      if (value) {
        values.add(value.current);
      }
    }

    return Array.from(values);
  }

  resolve<T>(...tokens: Token<T>[]): T {
    this.checkDisposed();

    // The current method signature allows for an empty array.
    // While that is not solved, let's throw an error when no tokens are provided.
    if (tokens.length === 0) {
      throwNoTokensProvidedError();
    }

    for (const token of tokens) {
      const registration = this.registry.get(token);

      if (registration) {
        return this.resolveRegistration(token, registration);
      }

      if (isConstructor(token)) {
        return this.instantiateClass(token);
      }
    }

    throwUnregisteredError(tokens);
  }

  resolveAll<T>(...tokens: Token<T>[]): NonNullable<T>[] {
    this.checkDisposed();

    // The current method signature allows for an empty array.
    // While that is not solved, let's throw an error when no tokens are provided.
    if (tokens.length === 0) {
      throwNoTokensProvidedError();
    }

    for (const token of tokens) {
      const registrations = this.registry.getAll(token);

      if (registrations) {
        return registrations
          .map((registration) => this.resolveRegistration(token, registration))
          .filter((value) => value != null);
      }

      if (isConstructor(token)) {
        return [this.instantiateClass(token)];
      }
    }

    return [];
  }

  dispose(): void {
    if (this.myDisposed) {
      return;
    }

    // Dispose children containers first
    for (const child of this.myChildren) {
      child.dispose();
    }

    this.myChildren.clear();

    // Remove ourselves from our parent container
    this.myParent?.myChildren?.delete(this);
    this.myDisposed = true;

    const registry = this.registry;
    const disposedRefs = new Set<any>();

    // Dispose all resolved (aka instantiated) tokens that implement the Disposable interface
    for (const registrations of registry.map.values()) {
      for (const registration of registrations) {
        const value = registration.value?.current;

        if (isDisposable(value) && !disposedRefs.has(value)) {
          disposedRefs.add(value);
          value.dispose();
        }
      }
    }

    // Allow values to be GCed
    disposedRefs.clear();
    registry.map.clear();
  }

  private resolveRegistration<T>(token: Token<T>, registration: Registration<T>): T {
    let currRegistration: Registration<T> | undefined = registration;
    let currProvider = currRegistration.provider;

    while (isExistingProvider(currProvider)) {
      const targetToken = currProvider.useExisting;
      currRegistration = this.registry.get(targetToken);

      if (!currRegistration) {
        throwExistingUnregisteredError(token, targetToken);
      }

      currProvider = currRegistration.provider;
    }

    try {
      return this.resolveProviderValue(currRegistration, currProvider);
    } catch (e) {
      // If we were trying to resolve a token registered via ExistingProvider,
      // we must add the cause of the error to the message
      if (isExistingProvider(registration.provider)) {
        throwExistingUnregisteredError(token, e as Error);
      }

      throw e;
    }
  }

  private instantiateClass<T extends object>(Class: Constructor<T>): T {
    const metadata = getMetadata(Class);

    if (metadata.autoRegister ?? this.myOptions.autoRegister) {
      this.register(Class);
      return (this as Container).resolve(Class);
    }

    const options: RegistrationOptions = {
      scope: this.resolveScope(metadata.scope),
    };

    assert(
      options.scope != Scope.Container,
      `unregistered class ${Class.name} cannot be resolved in container scope`,
    );

    const registration: Registration<T> = {
      provider: metadata.provider,
      options: options,
    };

    return this.resolveScopedValue(registration, () => new Class());
  }

  private resolveProviderValue<T>(
    registration: Registration<T>,
    provider: Exclude<Provider<T>, ExistingProvider<T>>,
  ): T {
    assert(registration.provider === provider, "internal error: mismatching provider");

    if (isClassProvider(provider)) {
      const Class = provider.useClass;
      return this.resolveScopedValue(registration, () => new Class());
    }

    if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.resolveScopedValue(registration, factory);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    expectNever(provider);
  }

  private resolveScopedValue<T>(registration: Registration<T>, create: () => T): T {
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
      switch (scope) {
        case "Container": {
          const valueRef = registration.value;

          if (valueRef) {
            return valueRef.current;
          }

          const value = create();
          registration.value = { current: value };
          return value;
        }
        case "Resolution": {
          const valueRef = resolution.values.get(provider);

          if (valueRef) {
            return valueRef.current;
          }

          const value = create();
          resolution.values.set(provider, { current: value });
          return value;
        }
        case "Transient": {
          return create();
        }
      }
    } finally {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    }
  }

  private resolveScope(
    scope = this.myOptions.defaultScope,
    context = useInjectionContext(),
  ): "Transient" | "Resolution" | "Container" {
    if (scope == Scope.Inherited) {
      const dependentFrame = context?.resolution.stack.peek();
      return dependentFrame?.scope || Scope.Transient;
    }

    return scope;
  }

  private checkDisposed(): void {
    assert(!this.myDisposed, "the container is disposed");
  }
}
