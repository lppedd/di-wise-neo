import type { ChildContainerOptions, Container, ContainerHook, ContainerOptions } from "./container";
import {
  check,
  getLocation,
  getTokenName,
  getTokenPath,
  throwCircularAliasError,
  throwParameterResolutionError,
  throwResolutionError,
  throwTargetUnregisteredError,
  throwUnregisteredError,
  type TokenInfo,
} from "./errors";
import { HookRegistry } from "./hookRegistry";
import { injectAll } from "./injectAll";
import { injectBy } from "./injectBy";
import { createResolution, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { getMetadata } from "./metadata";
import { optionalAll } from "./optionalAll";
import { optionalBy } from "./optionalBy";
import {
  type ExistingProvider,
  isClassProvider,
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
  type Provider,
} from "./provider";
import type { Scope } from "./scope";
import { type Constructor, isConstructor, type ProviderType, type Token } from "./token";
import { isBuilder, type MethodDependency, type Registration, type RegistrationOptions, TokenRegistry } from "./tokenRegistry";
import { isDisposable } from "./utils/disposable";

/**
 * The default implementation of a di-wise-neo {@link Container}.
 */
export class ContainerImpl implements Container {
  private readonly myParent?: ContainerImpl;
  private readonly myChildren: Set<ContainerImpl> = new Set();
  private readonly myOptions: ContainerOptions;
  private readonly myHookRegistry: HookRegistry;
  private readonly myTokenRegistry: TokenRegistry;
  private myDisposed: boolean = false;

  constructor(parent?: ContainerImpl, options?: Partial<ChildContainerOptions>) {
    this.myParent = parent;
    this.myOptions = {
      defaultScope: options?.defaultScope ?? "Transient",
      autoRegister: options?.autoRegister ?? false,
      disposeUnmanaged: options?.disposeUnmanaged ?? false,
    };

    const copyHooks = options?.copyHooks ?? true;
    this.myHookRegistry = new HookRegistry(copyHooks ? parent?.myHookRegistry : undefined);
    this.myTokenRegistry = new TokenRegistry(parent?.myTokenRegistry);
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

  createChild(options?: Partial<ChildContainerOptions>): Container {
    this.checkDisposed();
    const container = new ContainerImpl(this, {
      defaultScope: options?.defaultScope ?? this.myOptions.defaultScope,
      autoRegister: options?.autoRegister ?? this.myOptions.autoRegister,
      disposeUnmanaged: options?.disposeUnmanaged ?? this.myOptions.disposeUnmanaged,
      copyHooks: options?.copyHooks,
    });

    this.myChildren.add(container);
    return container;
  }

  clearCache(): unknown[] {
    this.checkDisposed();
    return this.myTokenRegistry.clearCache();
  }

  getCached<T>(token: Token<T>): T | undefined {
    this.checkDisposed();
    const registration = this.myTokenRegistry.get(token);
    return registration?.valueRef?.current;
  }

  getAllCached<T>(token: Token<T>): T[] {
    this.checkDisposed();
    const registrations = this.myTokenRegistry.getAll(token);
    const values = new Set<T>();

    for (const { valueRef } of registrations) {
      if (valueRef) {
        values.add(valueRef.current);
      }
    }

    return [...values];
  }

  resetRegistry(): unknown[] {
    this.checkDisposed();
    const [, registrations] = this.myTokenRegistry.deleteAll();
    const values = new Set<unknown>();

    for (const { valueRef } of registrations) {
      if (valueRef) {
        values.add(valueRef.current);
      }
    }

    return [...values];
  }

  isRegistered<T>(token: Token<T>, name?: string): boolean {
    this.checkDisposed();
    return this.myTokenRegistry.get(token, name) !== undefined;
  }

  register<T>(
    ...args:
      | [Constructor<T & object> | ProviderType<T>] //
      | [Token<T>, Provider<T>, RegistrationOptions?]
  ): Container {
    this.checkDisposed();

    if (args.length === 1) {
      const [token] = args;

      if (isConstructor(token)) {
        this.registerClass(token);
      } else {
        this.registerToken(token, token.provider, token.options);
      }
    } else {
      this.registerToken(...args);
    }

    return this;
  }

  unregister<T>(token: Token<T>, name?: string): T[] {
    this.checkDisposed();
    const registrations = this.myTokenRegistry.delete(token, name);
    const values = new Set<T>();

    for (const { valueRef } of registrations) {
      if (valueRef) {
        values.add(valueRef.current);
      }
    }

    return [...values];
  }

  resolve<T>(token: Token<T>, name?: string): T {
    this.checkDisposed();
    return this.resolveToken(token, name, false);
  }

  tryResolve<T>(token: Token<T>, name?: string): T | undefined {
    this.checkDisposed();
    return this.resolveToken(token, name, true);
  }

  resolveAll<T>(token: Token<T>): T[] {
    this.checkDisposed();
    return this.resolveAllToken(token, false);
  }

  tryResolveAll<T>(token: Token<T>): T[] {
    this.checkDisposed();
    return this.resolveAllToken(token, true);
  }

  addHook(hook: ContainerHook): void {
    this.myHookRegistry.add(hook);
  }

  removeHook(hook: ContainerHook): void {
    this.myHookRegistry.delete(hook);
  }

  dispose(): void {
    if (this.myDisposed) {
      return;
    }

    // Dispose children containers first
    for (const child of this.myChildren) {
      child.dispose();
    }

    this.myDisposed = true;
    this.myChildren.clear();
    this.myParent?.myChildren?.delete(this);

    const [, registrations] = this.myTokenRegistry.deleteAll();
    const disposeUnmanaged = this.myOptions.disposeUnmanaged;
    const cacheValues = new Set<unknown>();
    const allValues = new Set<unknown>();

    for (const { provider, valueRef } of registrations) {
      if (valueRef) {
        cacheValues.add(valueRef.current);
        allValues.add(valueRef.current);
      } else if (disposeUnmanaged && isValueProvider(provider)) {
        allValues.add(provider.useValue);
      }
    }

    for (const value of allValues) {
      if (isDisposable(value)) {
        value.dispose();
      }
    }

    this.notifyDisposeHooks([...cacheValues]);
    this.myHookRegistry.clear();
  }

  private registerClass<T extends object>(Class: Constructor<T>): void {
    const metadata = getMetadata(Class);
    const name = metadata.name;
    const registration: Registration<T> = {
      name: name,
      // The provider is of type ClassProvider, initialized by getMetadata
      provider: metadata.provider,
      options: {
        scope: metadata.scope?.value ?? this.myOptions.defaultScope,
      },
      dependencies: metadata.dependencies,
    };

    // Register the class itself
    this.myTokenRegistry.put(Class, registration);

    // Register the additional tokens specified via class decorators.
    // These tokens will point to the original Class token and will have the same scope.
    for (const token of metadata.tokenRef.getRefTokens()) {
      this.myTokenRegistry.put(token, {
        name: name,
        provider: {
          useExisting: [Class, name],
        },
      });
    }

    // Eager-instantiate only if the class is container-scoped.
    // Note that we are comparing the scope using the registration configured just above,
    // which takes into account both the metadata and the container option as a fallback.
    if (metadata.eagerInstantiate && registration.options?.scope === "Container") {
      this.resolveProviderValue(Class, registration);
    }
  }

  private registerToken<T>(token: Token<T>, provider: Provider<T>, options?: RegistrationOptions): void {
    const name = provider.name;
    check(name === undefined || name.trim(), `name qualifier for token ${getTokenName(token)} must not be empty`);

    if (isClassProvider(provider)) {
      const metadata = getMetadata(provider.useClass);
      const registration: Registration<T> = {
        // An explicit provider name overrides what is specified via @Named
        name: metadata.name ?? name,
        provider: metadata.provider,
        options: {
          // Explicit registration options override what is specified via class decorators (e.g., @Scoped)
          scope: metadata.scope?.value ?? this.myOptions.defaultScope,
          ...options,
        },
        dependencies: metadata.dependencies,
      };

      this.myTokenRegistry.put(token, registration);

      // Eager-instantiate only if the provided class is container-scoped.
      // Note that we are comparing the scope using the registration configured just above,
      // which takes into account both the metadata and the container option as a fallback.
      if (metadata.eagerInstantiate && registration.options?.scope === "Container") {
        this.resolveProviderValue(token, registration);
      }
    } else {
      if (isExistingProvider(provider)) {
        const [targetToken] = this.getTargetToken(provider);
        check(token !== targetToken, `token ${getTokenName(token)} cannot alias itself via useExisting`);
      }

      this.myTokenRegistry.put(token, {
        name: name,
        provider: provider,
        options: options,
      });
    }
  }

  private resolveToken<T>(token: Token<T>, name: string | undefined, optional: false): T;
  private resolveToken<T>(token: Token<T>, name: string | undefined, optional: true): T | undefined;
  private resolveToken<T>(token: Token<T>, name: string | undefined, optional: boolean): T | undefined {
    let registration = this.myTokenRegistry.get(token, name);

    if (!registration && isConstructor(token)) {
      registration = this.autoRegisterClass(token, name);
    }

    return this.resolveRegistration(token, registration, optional, name)?.value;
  }

  private resolveAllToken<T>(token: Token<T>, optional: boolean): T[] {
    let registrations = this.myTokenRegistry.getAll(token);

    if (registrations.length === 0 && isConstructor(token)) {
      const registration = this.autoRegisterClass(token);

      if (registration) {
        registrations = [registration];
      }
    }

    if (registrations.length === 0 && !optional) {
      throwUnregisteredError([token]);
    }

    return registrations
      .map((registration) => this.resolveRegistration(token, registration, optional))
      .filter((result) => result !== undefined)
      .map((result) => result.value);
  }

  private resolveRegistration<T>(
    token: Token<T>,
    registration: Registration<T> | undefined,
    optional?: boolean,
    name?: string,
  ): { value: T } | undefined {
    const aliases: TokenInfo[] = [];

    while (registration && isExistingProvider(registration.provider)) {
      const [targetToken, targetName] = this.getTargetToken(registration.provider);

      if (aliases.some(([t]) => t === targetToken)) {
        throwCircularAliasError([[token, name], ...aliases]);
      }

      // eslint-disable-next-line no-param-reassign
      registration = this.myTokenRegistry.get(targetToken, targetName);
      aliases.push([targetToken, targetName]);

      if (!registration && !optional) {
        throwTargetUnregisteredError([token, name], aliases);
      }
    }

    if (!registration) {
      return optional ? undefined : throwUnregisteredError([token, name]);
    }

    try {
      return {
        value: this.resolveProviderValue(token, registration),
      };
    } catch (e) {
      throwResolutionError([token, name], aliases, e);
    }
  }

  private getTargetToken<T>(provider: ExistingProvider<T>): [Token<T>, string?] {
    const token = provider.useExisting;
    return Array.isArray(token) ? token : [token];
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

  private resolveProviderValue<T>(token: Token<T>, registration: Registration<T>): T;
  private resolveProviderValue<T extends object>(token: Constructor<T>, registration: Registration<T>): T;
  private resolveProviderValue<T>(token: Token<T>, registration: Registration<T>): T {
    const provider = registration.provider;

    if (isClassProvider(provider)) {
      const Class = provider.useClass;
      return this.resolveScopedValue(token, registration, (args) => new Class(...args));
    }

    if (isFactoryProvider(provider)) {
      const factory = provider.useFactory;
      return this.resolveScopedValue(token, registration, () => factory());
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    check(false, "internal error: unexpected ExistingProvider");
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
        const path = getTokenPath(resolution.tokens.concat(token).map((t) => [t]));
        return `circular dependency detected while resolving ${path}`;
      });

      return dependentRef.current;
    }

    const scope = registration.options?.scope ?? this.myOptions.defaultScope;
    const cleanups = [
      provideInjectionContext(context),
      resolution.tokens.push(token) && (() => resolution.tokens.pop()),
      !isBuilder(provider) && resolution.stack.push(provider, { provider, scope }),
    ];

    try {
      switch (scope) {
        case "Container": {
          const valueRef = registration.valueRef;

          if (valueRef) {
            return valueRef.current;
          }

          const args = this.resolveCtorDependencies(registration);
          const value = this.injectMethodDependencies(registration, factory(args));
          registration.valueRef = { current: value };
          this.notifyProvideHooks(value, scope);
          return value;
        }
        case "Resolution": {
          const valueRef = resolution.values.get(provider);

          if (valueRef) {
            return valueRef.current;
          }

          const args = this.resolveCtorDependencies(registration);
          const value = this.injectMethodDependencies(registration, factory(args));
          resolution.values.set(provider, { current: value });
          this.notifyProvideHooks(value, scope);
          return value;
        }
        case "Transient": {
          const args = this.resolveCtorDependencies(registration);
          const value = this.injectMethodDependencies(registration, factory(args));
          this.notifyProvideHooks(value, scope);
          return value;
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
          return `${msg}, but found ${ctorDeps.length}`;
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
          return `${msg}, but found ${methodDeps.length}`;
        });

        const args = this.resolveArgs(methodDeps, ctor, instance, methodKey);
        method.bind(instance)(...args);
      }
    }

    return instance;
  }

  // Call context: decorator-based injection
  private resolveArgs(deps: MethodDependency[], ctor: Constructor<object>, instance?: any, methodKey?: string | symbol): any[] {
    const sortedDeps = deps.sort((a, b) => a.index - b.index);
    const args: any[] = [];

    for (const dep of sortedDeps) {
      try {
        args.push(this.resolveDependency(dep, instance));
      } catch (e) {
        throwParameterResolutionError(ctor, methodKey, dep, e);
      }
    }

    return args;
  }

  // Call context: decorator-based injection
  private resolveDependency(dependency: MethodDependency, instance?: any): any {
    const token = dependency.tokenRef!.getRefToken();
    check(token, `token passed to @${dependency.appliedBy} was undefined (possible circular imports)`);

    const name = dependency.name;
    switch (dependency.appliedBy) {
      case "Inject":
        return instance ? injectBy(instance, token, name) : this.resolve(token, name);
      case "InjectAll":
        return instance ? injectAll(token) : this.resolveAll(token);
      case "Optional":
        return instance ? optionalBy(instance, token, name) : this.tryResolve(token, name);
      case "OptionalAll":
        return instance ? optionalAll(token) : this.tryResolveAll(token);
    }
  }

  private notifyProvideHooks(value: unknown, scope: Scope): void {
    for (const hook of this.myHookRegistry.get()) {
      hook.onProvide?.(value, scope);
    }
  }

  private notifyDisposeHooks(values: unknown[]): void {
    for (const hook of this.myHookRegistry.get()) {
      hook.onDispose?.(values);
    }
  }

  private checkDisposed(): void {
    check(!this.myDisposed, "container is disposed");
  }
}
