import { ContainerImpl } from "./containerImpl";
import type { ClassProvider, ExistingProvider, FactoryProvider, ValueProvider } from "./provider";
import type { Scope } from "./scope";
import type { Constructor, ProviderType, Token } from "./token";
import type { RegistrationOptions, TokenRegistry } from "./tokenRegistry";

/**
 * Container creation options.
 */
export interface ContainerOptions {
  /**
   * The default scope for registrations.
   *
   * @defaultValue Transient
   */
  readonly defaultScope?: Scope;

  /**
   * Whether to automatically register an unregistered class when resolving it as a token.
   *
   * @defaultValue false
   */
  readonly autoRegister?: boolean;

  /**
   * Whether to also dispose values provided via {@link ValueProvider}, which are not
   * created or managed by the container, when the container itself is disposed.
   *
   * @defaultValue false
   */
  readonly disposeUnmanaged?: boolean;
}

/**
 * Child container creation options.
 */
export interface ChildContainerOptions extends ContainerOptions {
  /**
   * Whether to copy {@link ContainerHook}(s) from the parent container.
   *
   * @defaultValue true
   */
  readonly copyHooks?: boolean;
}

/**
 * A hook into the lifecycle of a {@link Container}.
 */
export interface ContainerHook {
  /**
   * Called when the container provides a value for a {@link Token}.
   * - For **Container**-scoped tokens, it is called only once when the token is first resolved and cached.
   * - For **Resolution**-scoped tokens, it is called once per token resolution graph.
   * - For **Transient**-scoped tokens, it is called each time the token is resolved,
   *   which might mean multiple times per resolution graph.
   *
   * @param value - The provided value.
   * @param scope - The {@link Scope} of the provided value.
   */
  readonly onProvide?: (value: unknown, scope: Scope) => void;

  /**
   * Called after the container has been disposed.
   *
   * @param values - All distinct values that were cached by the disposed container.
   *   Currently, only **Container**-scoped token values are cached.
   */
  readonly onDispose?: (values: unknown[]) => void;
}

/**
 * A Dependency Injection container.
 */
export interface Container {
  /**
   * @internal
   */
  readonly registry: TokenRegistry;

  /**
   * The options used to create this container.
   */
  readonly options: Required<ContainerOptions>;

  /**
   * The parent container, or `undefined` if this is the root container.
   */
  readonly parent: Container | undefined;

  /**
   * Whether this container is disposed.
   */
  readonly isDisposed: boolean;

  /**
   * Creates a new child container that inherits this container's options.
   *
   * You can pass specific options to override the inherited ones.
   */
  createChild(options?: ChildContainerOptions): Container;

  /**
   * Clears and returns all distinct values cached by this container.
   * Values from {@link ValueProvider} registrations are not included, as they are never cached.
   *
   * Note that only this container is affected. Parent or child containers, if any, remain unchanged.
   */
  clearCache(): unknown[];

  /**
   * Returns the cached value from the most recent registration of the token,
   * or `undefined` if no value has been cached yet (the token has not been resolved yet).
   *
   * If the token has at least one registration in this container,
   * the cached value is taken from the most recent of those registrations.
   * Otherwise, it may be retrieved from parent containers, if any.
   *
   * Values are never cached for tokens with **Transient** or **Resolution** scope,
   * or for {@link ValueProvider} registrations.
   */
  getCached<Value>(token: Token<Value>): Value | undefined;

  /**
   * Returns all cached values associated with registrations of the token,
   * in the order they were registered, or an empty array if none have been cached.
   *
   * If the token has at least one registration in the current container,
   * cached values are taken from those registrations.
   * Otherwise, cached values may be retrieved from parent containers, if any.
   *
   * Values are never cached for tokens with **Transient** or **Resolution** scope,
   * or for {@link ValueProvider} registrations.
   */
  getAllCached<Value>(token: Token<Value>): Value[];

  /**
   * Removes all registrations from this container's internal registry.
   *
   * Returns an array of the distinct values that were cached by this container for the
   * removed registrations. Values from {@link ValueProvider} registrations are not included,
   * as they are not cached.
   *
   * Note that only this container is affected. Parent or child containers, if any, remain unchanged.
   */
  resetRegistry(): unknown[];

  /**
   * Returns whether the token is registered in this container or in parent containers, if any.
   */
  isRegistered<Value>(token: Token<Value>, name?: string): boolean;

  /**
   * Registers a {@link ClassProvider}, using the class itself as its token.
   *
   * Tokens provided via the {@link Injectable} decorator applied to the class
   * are also registered as aliases.
   *
   * The scope is determined by the {@link Scoped} decorator - if present -
   * or by the {@link ContainerOptions.defaultScope} value.
   */
  register<Instance extends object>(Class: Constructor<Instance>): Container;

  /**
   * Registers a token type with a default {@link Provider} and optional default registration options.
   */
  register<Value>(token: ProviderType<Value>): Container;

  /**
   * Registers a {@link ClassProvider} with a token.
   *
   * The default registration scope is determined by the {@link Scoped} decorator
   * applied to the provided class - if present - or by the {@link ContainerOptions.defaultScope}
   * value, but it can be overridden by passing explicit registration options.
   */
  register<Instance extends object, ProviderInstance extends Instance>(
    token: Token<Instance>,
    provider: ClassProvider<ProviderInstance>,
    options?: RegistrationOptions,
  ): Container;

  /**
   * Registers a {@link FactoryProvider} with a token.
   */
  register<Value, ProviderValue extends Value>(
    token: Token<Value>,
    provider: FactoryProvider<ProviderValue>,
    options?: RegistrationOptions,
  ): Container;

  /**
   * Registers an {@link ExistingProvider} with a token.
   *
   * The token will alias the one set in `useExisting`.
   */
  register<Value, ProviderValue extends Value>(token: Token<Value>, provider: ExistingProvider<ProviderValue>): Container;

  /**
   * Registers a {@link ValueProvider} with a token.
   *
   * Values provided via `useValue` are never cached (scopes do not apply)
   * and are simply returned as-is.
   */
  register<Value, ProviderValue extends Value>(token: Token<Value>, provider: ValueProvider<ProviderValue>): Container;

  /**
   * Removes all registrations for the given token from the container's internal registry.
   *
   * Returns an array of the distinct values that were cached by this container for the
   * removed registrations. Values from {@link ValueProvider} registrations are not included,
   * as they are not cached.
   *
   * Note that only this container is affected. Parent or child containers, if any, remain unchanged.
   */
  unregister<Value>(token: Token<Value>, name?: string): Value[];

  /**
   * Resolves the given class to the instance associated with it.
   *
   * If the class is registered in this container or any of its parent containers,
   * an instance is created using the most recent registration.
   *
   * If the class is not registered, but it is decorated with {@link AutoRegister},
   * or {@link ContainerOptions.autoRegister} is true, the class is registered automatically.
   * Otherwise, the resolution fails.
   *
   * The scope for the automatic registration is determined by either
   * the {@link Scoped} decorator on the class, or {@link ContainerOptions.defaultScope}.
   *
   * If the class is not registered in this container or any of its parent containers
   * and could not be auto-registered, an error is thrown.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the class is registered with **Container** scope, the resolved instance is cached
   * in the container's internal registry.
   */
  resolve<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance;

  /**
   * Resolves the given token to the value associated with it.
   *
   * If the token is registered in this container or any of its parent containers,
   * its value is resolved using the most recent registration.
   *
   * If the token is not registered in this container or any of its parent containers, an error is thrown.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with **Container** scope, the resolved value is cached
   * in the container's internal registry.
   */
  resolve<Value>(token: Token<Value>, name?: string): Value;

  /**
   * Resolves the given class to the instance associated with it.
   *
   * If the class is registered in this container or any of its parent containers,
   * an instance is created using the most recent registration.
   *
   * If the class is not registered, but it is decorated with {@link AutoRegister},
   * or {@link ContainerOptions.autoRegister} is true, the class is registered automatically.
   * Otherwise, the resolution fails.
   *
   * The scope for the automatic registration is determined by either
   * the {@link Scoped} decorator on the class, or {@link ContainerOptions.defaultScope}.
   *
   * If the class is not registered in this container or any of its parent containers
   * and could not be auto-registered, `undefined` is returned instead.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the class is registered with **Container** scope, the resolved instance is cached
   * in the container's internal registry.
   */
  tryResolve<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance | undefined;

  /**
   * Tries to resolve the given token to the value associated with it.
   *
   * If the token is registered in this container or any of its parent containers,
   * its value is resolved using the most recent registration.
   *
   * If the token is not registered in this container or any of its parent containers,
   * `undefined` is returned instead.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with **Container** scope, the resolved value is cached
   * in the container's internal registry.
   */
  tryResolve<Value>(token: Token<Value>, name?: string): Value | undefined;

  /**
   * Resolves the given class to all instances provided by the registrations associated with it.
   *
   * If the class is not registered, but it is decorated with {@link AutoRegister},
   * or {@link ContainerOptions.autoRegister} is true, the class is registered automatically.
   * Otherwise, the resolution fails.
   *
   * The scope for the automatic registration is determined by either
   * the {@link Scoped} decorator on the class, or {@link ContainerOptions.defaultScope}.
   *
   * If the class is not registered in this container or any of its parent containers
   * and could not be auto-registered, an error is thrown.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the class is registered with **Container** scope, the resolved instances are cached
   * in the container's internal registry.
   *
   * A separate instance of the class is created for each provider.
   */
  resolveAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Resolves the given token to all values provided by the registrations associated with it.
   *
   * If the token is not registered in this container or any of its parent containers, an error is thrown.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with **Container** scope, the resolved values are cached
   * in the container's internal registry.
   */
  resolveAll<Value>(token: Token<Value>): Value[];

  /**
   * Resolves the given class to all instances provided by the registrations associated with it.
   *
   * If the class is not registered, but it is decorated with {@link AutoRegister},
   * or {@link ContainerOptions.autoRegister} is true, the class is registered automatically.
   * Otherwise, the resolution fails.
   *
   * The scope for the automatic registration is determined by either
   * the {@link Scoped} decorator on the class, or {@link ContainerOptions.defaultScope}.
   *
   * If the class is not registered in this container or any of its parent containers
   * and could not be auto-registered, an empty array is returned instead.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the class is registered with **Container** scope, the resolved instances are cached
   * in the container's internal registry.
   *
   * A separate instance of the class is created for each provider.
   */
  tryResolveAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Resolves the given token to all values provided by the registrations associated with it.
   *
   * If the token is not registered in this container or any of its parent containers,
   * an empty array is returned instead.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with **Container** scope, the resolved values are cached
   * in the container's internal registry.
   */
  tryResolveAll<Value>(token: Token<Value>): Value[];

  /**
   * Adds a hook to observe the lifecycle of container-managed values.
   *
   * Does nothing if the hook has already been added.
   */
  addHook(hook: ContainerHook): void;

  /**
   * Removes a previously added hook.
   *
   * Does nothing if the hook has not been added yet.
   */
  removeHook(hook: ContainerHook): void;

  /**
   * Disposes this container and all its cached values.
   *
   * Token values implementing a `Disposable` interface (e.g., objects with a `dispose()` function)
   * are also disposed. All disposals, whether synchronous or asynchronous, are returned as promises
   * in an array. Callers may await these promises (e.g., using `Promise.allSettled()`) if they want
   * to ensure that all async work has completed.
   *
   * Note that children containers are disposed first, in creation order.
   */
  dispose(): Promise<unknown>[];
}

/**
 * Creates a new container.
 */
export function createContainer(options?: ContainerOptions): Container {
  return new ContainerImpl(undefined, options);
}
