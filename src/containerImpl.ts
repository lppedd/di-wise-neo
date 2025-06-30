import type { Container, ContainerOptions } from "./container";
import { assert, expectNever, throwExistingUnregisteredError, throwUnregisteredError } from "./errors";
import { injectBy } from "./inject";
import { injectAll } from "./injectAll";
import { createResolution, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { getMetadata } from "./metadata";
import { optionalBy } from "./optional";
import { optionalAll } from "./optionalAll";
import {
  isClassProvider,
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
  type Provider,
} from "./provider";
import { Scope } from "./scope";
import { type Constructor, isConstructor, type Token, type Tokens } from "./token";
import { isBuilder, type Registration, type RegistrationOptions, TokenRegistry } from "./tokenRegistry";
import { isDisposable } from "./utils/disposable";

/**
 * The default implementation of a di-wise-neo {@link Container}.
 */
export class ContainerImpl implements Container {
  private readonly myParent?: ContainerImpl;
  private readonly myChildren: Set<ContainerImpl> = new Set();
  private readonly myOptions: ContainerOptions;
  private readonly myTokenRegistry: TokenRegistry;
  private myDisposed: boolean = false;

  constructor(parent: ContainerImpl | undefined, options: Partial<ContainerOptions>) {
    this.myParent = parent;
    this.myOptions = {
      autoRegister: false,
      defaultScope: Scope.Inherited,
      ...options,
    };

    this.myTokenRegistry = new TokenRegistry(this.myParent?.myTokenRegistry);
  }

  get registry(): TokenRegistry {
    return this.myTokenRegistry;
  }

  get options(): ContainerOptions {
    return {
      ...this.myOptions,
    };
  }

  get parent(): Container | undefined {
    return this.myParent;
  }

  get isDisposed(): boolean {
    return this.myDisposed;
  }

  createChild(options?: Partial<ContainerOptions>): Container {
    this.checkDisposed();
    const container = new ContainerImpl(this, {
      ...this.myOptions,
      ...options,
    });

    this.myChildren.add(container);
    return container;
  }

  clearCache(): unknown[] {
    this.checkDisposed();
    return this.myTokenRegistry.clearRegistrations();
  }

  getCached<T>(token: Token<T>): T | undefined {
    this.checkDisposed();
    const registration = this.myTokenRegistry.get(token);
    return registration?.value?.current;
  }

  getAllCached<T>(token: Token<T>): T[] {
    this.checkDisposed();
    const registrations = this.myTokenRegistry.getAll(token);

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
    const [, registrations] = this.myTokenRegistry.deleteAll();
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
    return this.myTokenRegistry.get(token) !== undefined;
  }

  registerClass<T extends object, V extends T>(
    token: Token<T>,
    Class?: Constructor<V>,
    options?: RegistrationOptions,
  ): void {
    // This mess will go away once/if we remove the register method
    // in favor of the multiple specialized ones
    if (Class) {
      const ctor = (Class ?? token) as Constructor<any>;
      this.register(token, { useClass: ctor }, options);
    } else {
      this.register(token as Constructor<any>);
    }
  }

  registerFactory<T, V extends T>(
    token: Token<T>,
    factory: (...args: []) => V,
    options?: RegistrationOptions,
  ): void {
    this.register(token, { useFactory: factory }, options);
  }

  registerValue<T, V extends T>(token: Token<T>, value: V): void {
    this.register(token, { useValue: value });
  }

  registerAlias<T, V extends T>(targetToken: Token<V>, aliasTokens: Tokens<T>): void {
    // De-duplicate tokens
    for (const alias of new Set(aliasTokens)) {
      this.register(alias, { useExisting: targetToken });
    }
  }

  register<T>(...args: [Constructor<T & object>] | [Token<T>, Provider<T>, RegistrationOptions?]): Container {
    this.checkDisposed();

    if (args.length == 1) {
      const Class = args[0];
      const metadata = getMetadata(Class);
      const registration: Registration = {
        // The provider is of type ClassProvider, initialized by getMetadata
        provider: metadata.provider,
        options: {
          scope: metadata.scope ?? this.myOptions.defaultScope,
        },
        dependencies: metadata.dependencies,
      };

      // Register the class itself
      this.myTokenRegistry.set(Class, registration);

      // Register the additional tokens specified via class decorators.
      // These tokens will point to the original Class token and will have the same scope.
      for (const token of metadata.tokensRef.getRefTokens()) {
        this.myTokenRegistry.set(token, {
          provider: {
            useExisting: Class,
          },
        });
      }

      // Eager-instantiate only if the class is container-scoped
      if (metadata.eagerInstantiate && registration.options?.scope === Scope.Container) {
        this.resolve(Class);
      }
    } else {
      const [token, provider, options] = args;

      if (isClassProvider(provider)) {
        const metadata = getMetadata(provider.useClass);
        const registration: Registration = {
          provider: metadata.provider,
          options: {
            // The explicit registration options override what is specified
            // via class decorators (e.g., @Scoped)
            scope: metadata.scope ?? this.myOptions.defaultScope,
            ...options,
          },
          dependencies: metadata.dependencies,
        };

        this.myTokenRegistry.set(token, registration);

        // Eager-instantiate only if the provided class is container-scoped
        if (metadata.eagerInstantiate && registration.options?.scope === Scope.Container) {
          this.resolve(token);
        }
      } else {
        if (isExistingProvider(provider)) {
          assert(
            token !== provider.useExisting,
            `the useExisting token ${token.name} cannot be the same as the token being registered`,
          );
        }

        this.myTokenRegistry.set(token, {
          provider: provider,
          options: options,
        });
      }
    }

    return this;
  }

  unregister<T>(token: Token<T>): T[] {
    this.checkDisposed();
    const registrations = this.myTokenRegistry.delete(token);

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

  resolve<T>(token: Token<T>, optional?: boolean): T | undefined {
    this.checkDisposed();
    const registration = this.myTokenRegistry.get(token);

    if (registration) {
      return this.resolveRegistration(token, registration);
    }

    if (isConstructor(token)) {
      return this.instantiateClass(token, optional);
    }

    return optional ? undefined : throwUnregisteredError(token);
  }

  resolveAll<T>(token: Token<T>, optional?: boolean): NonNullable<T>[] {
    this.checkDisposed();
    const registrations = this.myTokenRegistry.getAll(token);

    if (registrations) {
      return registrations
        .map((registration) => this.resolveRegistration(token, registration))
        .filter((value) => value != null);
    }

    if (isConstructor(token)) {
      const instance = this.instantiateClass(token, optional);
      return instance === undefined // = could not resolve, but since it is optional
        ? []
        : [instance];
    }

    return optional ? [] : throwUnregisteredError(token);
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

    const [, registrations] = this.myTokenRegistry.deleteAll();
    const disposedRefs = new Set<any>();

    // Dispose all resolved (aka instantiated) tokens that implement the Disposable interface
    for (const registration of registrations) {
      const value = registration.value?.current;

      if (isDisposable(value) && !disposedRefs.has(value)) {
        disposedRefs.add(value);
        value.dispose();
      }
    }

    // Allow values to be GCed
    disposedRefs.clear();
  }

  private resolveRegistration<T>(token: Token<T>, registration: Registration<T>): T {
    let currRegistration: Registration<T> | undefined = registration;
    let currProvider = currRegistration.provider;

    while (isExistingProvider(currProvider)) {
      const targetToken = currProvider.useExisting;
      currRegistration = this.myTokenRegistry.get(targetToken);

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

  private instantiateClass<T extends object>(Class: Constructor<T>, optional?: boolean): T | undefined {
    const metadata = getMetadata(Class);

    if (metadata.autoRegister ?? this.myOptions.autoRegister) {
      // Temporarily set eagerInstantiate to false to avoid resolving the class two times:
      // one inside register(), and the other just below
      const eagerInstantiate = metadata.eagerInstantiate;
      metadata.eagerInstantiate = false;

      try {
        this.register(Class);
        return (this as Container).resolve(Class);
      } finally {
        metadata.eagerInstantiate = eagerInstantiate;
      }
    }

    const scope = this.resolveScope(metadata.scope);

    if (optional && scope === Scope.Container) {
      // It would not be possible to resolve the class in container scope,
      // as that would require prior registration.
      // However, since resolution is marked optional, we simply return undefined.
      return undefined;
    }

    assert(
      scope !== Scope.Container,
      `unregistered class ${Class.name} cannot be resolved in container scope`,
    );

    const registration: Registration<T> = {
      provider: metadata.provider,
      options: {
        scope: scope,
      },
      dependencies: metadata.dependencies,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.resolveScopedValue(registration, (args) => new Class(...args));
  }

  private resolveProviderValue<T>(registration: Registration<T>, provider: Provider<T>): T {
    assert(registration.provider === provider, "internal error: mismatching provider");

    if (isClassProvider(provider)) {
      const Class = provider.useClass;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return this.resolveScopedValue(registration, (args) => new Class(...args));
    }

    if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.resolveScopedValue(registration, factory);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    if (isExistingProvider(provider)) {
      assert(false, "internal error: unexpected ExistingProvider");
    }

    expectNever(provider);
  }

  private resolveScopedValue<T>(registration: Registration<T>, factory: (...args: any[]) => T): T {
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
        case Scope.Container: {
          const valueRef = registration.value;

          if (valueRef) {
            return valueRef.current;
          }

          const args = this.resolveConstructorDependencies(registration);
          const value = this.injectDependencies(registration, factory(args));
          registration.value = { current: value };
          return value;
        }
        case Scope.Resolution: {
          const valueRef = resolution.values.get(provider);

          if (valueRef) {
            return valueRef.current;
          }

          const args = this.resolveConstructorDependencies(registration);
          const value = this.injectDependencies(registration, factory(args));
          resolution.values.set(provider, { current: value });
          return value;
        }
        case Scope.Transient: {
          const args = this.resolveConstructorDependencies(registration);
          return this.injectDependencies(registration, factory(args));
        }
      }
    } finally {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    }
  }

  private resolveScope(
    scope = this.myOptions.defaultScope,
    context = useInjectionContext(),
  ): Exclude<Scope, typeof Scope.Inherited> {
    if (scope == Scope.Inherited) {
      const dependentFrame = context?.resolution.stack.peek();
      return dependentFrame?.scope || Scope.Transient;
    }

    return scope;
  }

  private resolveConstructorDependencies<T>(registration: Registration<T>): any[] {
    const dependencies = registration.dependencies;

    if (dependencies) {
      assert(isClassProvider(registration.provider), `internal error: not a ClassProvider`);
      const ctorDeps = dependencies.constructor;

      if (ctorDeps.length > 0) {
        // Let's check if all necessary constructor parameters are decorated.
        // If not, we cannot safely create an instance.
        const ctor = registration.provider.useClass;
        assert(ctor.length === ctorDeps.length, () => {
          const msg = `expected ${ctor.length} decorated constructor parameters in ${ctor.name}`;
          return msg + `, but found ${ctorDeps.length}`;
        });

        return ctorDeps
          .sort((a, b) => a.index - b.index)
          .map((dep) => {
            const token = dep.tokenRef.getRefToken();
            switch (dep.decorator) {
              case "Inject":
                return this.resolve(token);
              case "InjectAll":
                return this.resolveAll(token);
              case "Optional":
                return this.resolve(token, true);
              case "OptionalAll":
                return this.resolveAll(token, true);
            }
          });
      }
    }

    return [];
  }

  private injectDependencies<T>(registration: Registration<T>, instance: T): T {
    const dependencies = registration.dependencies;

    if (dependencies) {
      assert(isClassProvider(registration.provider), `internal error: not a ClassProvider`);
      const ctor = registration.provider.useClass;

      // Perform method injection
      for (const [key, methodDeps] of dependencies.methods) {
        // Let's check if all necessary method parameters are decorated.
        // If not, we cannot safely invoke the method.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const method = (instance as any)[key] as Function;
        assert(methodDeps.length === method.length, () => {
          const msg = `expected ${method.length} decorated method parameters`;
          return msg + ` in ${ctor.name}.${String(key)}, but found ${methodDeps.length}`;
        });

        const args = methodDeps
          .sort((a, b) => a.index - b.index)
          .map((dep) => {
            const token = dep.tokenRef.getRefToken();
            switch (dep.decorator) {
              case "Inject":
                return injectBy(instance, token);
              case "InjectAll":
                return injectAll(token);
              case "Optional":
                return optionalBy(instance, token);
              case "OptionalAll":
                return optionalAll(token);
            }
          });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        method.bind(instance)(...args);
      }
    }

    return instance;
  }

  private checkDisposed(): void {
    assert(!this.myDisposed, "the container is disposed");
  }
}
