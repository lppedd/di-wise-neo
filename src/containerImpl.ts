import type { Container, ContainerOptions } from "./container";
import {
  check,
  expectNever,
  getLocation,
  getTokenName,
  throwExistingUnregisteredError,
  throwParameterResolutionError,
  throwUnregisteredError,
} from "./errors";
import { injectBy } from "./inject";
import { injectAll } from "./injectAll";
import { createResolution, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { getMetadata } from "./metadata";
import { optionalBy } from "./optional";
import { optionalAll } from "./optionalAll";
import { isClassProvider, isExistingProvider, isFactoryProvider, isValueProvider, type Provider } from "./provider";
import { Scope } from "./scope";
import { type Constructor, isConstructor, type Token } from "./token";
import { isBuilder, type MethodDependency, type Registration, type RegistrationOptions, TokenRegistry } from "./tokenRegistry";
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
      defaultScope: Scope.Transient,
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

  isRegistered(token: Token, name?: string): boolean {
    this.checkDisposed();
    return this.myTokenRegistry.get(token, name) !== undefined;
  }

  register<T>(...args: [Constructor<T & object>] | [Token<T>, Provider<T>, RegistrationOptions?]): Container {
    this.checkDisposed();

    if (args.length === 1) {
      const Class = args[0];
      const metadata = getMetadata(Class);
      const registration: Registration = {
        name: metadata.name,
        // The provider is of type ClassProvider, initialized by getMetadata
        provider: metadata.provider,
        options: {
          scope: metadata.scope?.value ?? this.myOptions.defaultScope,
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
        this.resolveProviderValue(Class, registration);
      }
    } else {
      const [token, provider, options] = args;
      const existingProvider = isExistingProvider(provider);
      const name = existingProvider ? undefined : provider.name;
      check(name === undefined || name.trim(), `name qualifier for token ${getTokenName(token)} must not be empty`);

      if (isClassProvider(provider)) {
        const metadata = getMetadata(provider.useClass);
        const registration: Registration = {
          // An explicit provider name overrides what is specified via @Named
          name: metadata.name ?? provider.name,
          provider: metadata.provider,
          options: {
            // Explicit registration options override what is specified via class decorators (e.g., @Scoped)
            scope: metadata.scope?.value ?? this.myOptions.defaultScope,
            ...options,
          },
          dependencies: metadata.dependencies,
        };

        this.myTokenRegistry.set(token, registration);

        // Eager-instantiate only if the provided class is container-scoped
        if (metadata.eagerInstantiate && registration.options?.scope === Scope.Container) {
          this.resolveProviderValue(token, registration);
        }
      } else {
        if (existingProvider) {
          check(token !== provider.useExisting, `token ${getTokenName(token)} cannot alias itself via useExisting`);
        }

        this.myTokenRegistry.set(token, {
          name: name,
          provider: provider,
          options: options,
        });
      }
    }

    return this;
  }

  unregister<T>(token: Token<T>, name?: string): T[] {
    this.checkDisposed();

    const registrations = this.myTokenRegistry.delete(token, name);
    const values = new Set<T>();

    for (const registration of registrations) {
      const value = registration.value;

      if (value) {
        values.add(value.current);
      }
    }

    return Array.from(values);
  }

  resolve<T>(token: Token<T>, optionalOrName?: boolean | string, name?: string): T | undefined {
    this.checkDisposed();

    let localOptional: boolean | undefined;
    let localName: string | undefined;

    if (typeof optionalOrName === "string") {
      localName = optionalOrName;
    } else {
      localOptional = optionalOrName;
      localName = name;
    }

    let registration = this.myTokenRegistry.get(token, localName);

    if (!registration && isConstructor(token)) {
      registration = this.autoRegisterClass(token, localName);
    }

    if (registration) {
      return this.resolveRegistration(token, registration, localName);
    }

    return localOptional ? undefined : throwUnregisteredError(token, localName);
  }

  resolveAll<T>(token: Token<T>, optional?: boolean): NonNullable<T>[] {
    this.checkDisposed();
    let registrations = this.myTokenRegistry.getAll(token);

    if (registrations.length === 0 && isConstructor(token)) {
      const registration = this.autoRegisterClass(token);

      if (registration) {
        registrations = [registration];
      }
    }

    if (registrations.length > 0) {
      return registrations //
        .map((registration) => this.resolveRegistration(token, registration))
        .filter((value) => value != null);
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

  private resolveRegistration<T>(token: Token<T>, registration: Registration<T>, name?: string): T {
    let currRegistration: Registration<T> | undefined = registration;

    while (isExistingProvider(currRegistration.provider)) {
      const targetToken: Token<T> = currRegistration.provider.useExisting;
      currRegistration = this.myTokenRegistry.get(targetToken, name);

      if (!currRegistration) {
        throwExistingUnregisteredError(token, targetToken);
      }
    }

    return this.resolveProviderValue(token, currRegistration);
  }

  private autoRegisterClass<T extends object>(Class: Constructor<T>, name?: string): Registration<T> | undefined {
    const metadata = getMetadata(Class);
    const autoRegister = metadata.autoRegister ?? this.myOptions.autoRegister;

    if (autoRegister && (name === undefined || metadata.name === name)) {
      // Temporarily set eagerInstantiate to false to avoid potentially resolving
      // the class inside register()
      const eagerInstantiate = metadata.eagerInstantiate;
      metadata.eagerInstantiate = false;

      try {
        this.register(Class);
        return this.myTokenRegistry.get(Class, name ?? metadata.name);
      } finally {
        metadata.eagerInstantiate = eagerInstantiate;
      }
    }

    return undefined;
  }

  private resolveProviderValue<T>(token: Token<T>, registration: Registration<T>): T {
    const provider = registration.provider;

    if (isClassProvider(provider)) {
      const Class = provider.useClass;
      return this.resolveScopedValue(token, registration, (args) => new Class(...args));
    }

    if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.resolveScopedValue(token, registration, factory);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    check(!isExistingProvider(provider), "internal error: unexpected ExistingProvider");
    expectNever(provider);
  }

  private resolveScopedValue<T>(token: Token<T>, registration: Registration<T>, factory: (...args: any[]) => T): T {
    let context = useInjectionContext();

    if (!context || context.container !== this) {
      context = {
        container: this,
        resolution: createResolution(),
      };
    }

    const resolution = context.resolution;
    const provider = registration.provider;

    if (resolution.stack.has(provider)) {
      const dependentRef = resolution.dependents.get(provider);
      check(dependentRef, () => {
        const path = resolution.tokenStack.map(getTokenName).concat(getTokenName(token)).join(" → ");
        return `circular dependency detected while resolving ${path}`;
      });

      return dependentRef.current;
    }

    const scope = registration.options?.scope ?? this.myOptions.defaultScope;
    const cleanups = [
      provideInjectionContext(context),
      resolution.tokenStack.push(token) && (() => resolution.tokenStack.pop()),
      !isBuilder(provider) && resolution.stack.push(provider, { provider, scope }),
    ];

    try {
      switch (scope) {
        case Scope.Container: {
          const valueRef = registration.value;

          if (valueRef) {
            return valueRef.current;
          }

          const args = this.resolveCtorDependencies(registration);
          const value = this.injectMethodDependencies(registration, factory(args));
          registration.value = { current: value };
          return value;
        }
        case Scope.Resolution: {
          const valueRef = resolution.values.get(provider);

          if (valueRef) {
            return valueRef.current;
          }

          const args = this.resolveCtorDependencies(registration);
          const value = this.injectMethodDependencies(registration, factory(args));
          resolution.values.set(provider, { current: value });
          return value;
        }
        case Scope.Transient: {
          const args = this.resolveCtorDependencies(registration);
          return this.injectMethodDependencies(registration, factory(args));
        }
      }
    } finally {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    }
  }

  private resolveCtorDependencies<T>(registration: Registration<T>): any[] {
    const dependencies = registration.dependencies;

    if (dependencies) {
      check(isClassProvider(registration.provider), `internal error: not a ClassProvider`);
      const ctorDeps = dependencies.ctor.filter((d) => d.appliedBy);

      if (ctorDeps.length > 0) {
        // Let's check if all necessary constructor parameters are decorated.
        // If not, we cannot safely create an instance.
        const ctor = registration.provider.useClass;
        check(ctor.length === ctorDeps.length, () => {
          const location = getLocation(ctor);
          const msg = `${location} expected ${ctor.length} decorated constructor parameters`;
          return msg + `, but found ${ctorDeps.length}`;
        });

        return this.resolveArgs(ctorDeps, ctor);
      }
    }

    return [];
  }

  private injectMethodDependencies<T>(registration: Registration<T>, instance: T): T {
    const dependencies = registration.dependencies;

    if (dependencies) {
      check(isClassProvider(registration.provider), `internal error: not a ClassProvider`);
      const ctor = registration.provider.useClass;

      // Perform method injection
      for (const entry of dependencies.methods) {
        const methodKey = entry[0];
        const methodDeps = entry[1].filter((d) => d.appliedBy);

        // Let's check if all necessary method parameters are decorated.
        // If not, we cannot safely invoke the method.
        const method = (instance as any)[methodKey] as Function;
        check(methodDeps.length === method.length, () => {
          const location = getLocation(ctor, methodKey);
          const msg = `${location} expected ${method.length} decorated method parameters`;
          return msg + `, but found ${methodDeps.length}`;
        });

        const args = this.resolveArgs(methodDeps, ctor, instance, methodKey);
        method.bind(instance)(...args);
      }
    }

    return instance;
  }

  private resolveArgs(deps: MethodDependency[], ctor: Constructor<any>, instance?: any, methodKey?: string | symbol): any[] {
    const sortedDeps = deps.sort((a, b) => a.index - b.index);
    const args: any[] = [];

    for (const dep of sortedDeps) {
      try {
        args.push(this.resolveDependency(dep, instance));
      } catch (e) {
        throwParameterResolutionError(ctor, methodKey, dep, e as Error);
      }
    }

    return args;
  }

  private resolveDependency(dependency: MethodDependency, instance?: any): any {
    const token = dependency.tokenRef!.getRefToken();
    const name = dependency.name;
    switch (dependency.appliedBy) {
      case "Inject":
        return instance ? injectBy(instance, token, name) : this.resolve(token, name);
      case "InjectAll":
        return instance ? injectAll(token) : this.resolveAll(token);
      case "Optional":
        return instance ? optionalBy(instance, token, name) : this.resolve(token, true, name);
      case "OptionalAll":
        return instance ? optionalAll(token) : this.resolveAll(token, true);
    }
  }

  private checkDisposed(): void {
    check(!this.myDisposed, "container is disposed");
  }
}
