import { DefaultContainer } from "./defaultContainer";
import type { ClassProvider, ExistingProvider, FactoryProvider, ValueProvider } from "./provider";
import { Scope } from "./scope";
import type { Constructor, Token } from "./token";
import type { RegistrationOptions, TokenRegistry } from "./tokenRegistry";

/**
 * Options for creating a container.
 */
export interface ContainerOptions {
  /**
   * Whether to automatically register a class when resolving it as a token.
   *
   * @defaultValue false
   */
  readonly autoRegister: boolean;

  /**
   * The default scope for registrations.
   *
   * @defaultValue Scope.Inherited
   */
  readonly defaultScope: Scope;
}

/**
 * Container API.
 */
export interface Container {
  /**
   * @internal
   */
  api?: Readonly<Container>;

  /**
   * @internal
   */
  readonly registry: TokenRegistry;

  /**
   * The options used to create this container.
   */
  readonly options: ContainerOptions;

  /**
   * Whether this container is disposed.
   */
  readonly isDisposed: boolean;

  /**
   * Returns the parent container, if any.
   */
  getParent(): Container | undefined;

  /**
   * Creates a new child container that inherits this container's options.
   *
   * You can pass specific options to override the inherited ones.
   */
  createChild(options?: Partial<ContainerOptions>): Container;

  /**
   * Clears and returns all distinct cached values from this container's internal registry.
   * Values from {@link ValueProvider} registrations are not included, as they are never cached.
   *
   * Note that only this container is affected. Parent containers, if any, remain unchanged.
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
   * Values are never cached for tokens with _transient_ or _resolution_ scope,
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
   * Values are never cached for tokens with _transient_ or _resolution_ scope,
   * or for {@link ValueProvider} registrations.
   */
  getAllCached<Value>(token: Token<Value>): Value[];

  /**
   * Removes all registrations from this container's internal registry.
   *
   * Returns an array of distinct cached values that were stored within the removed registrations.
   * Values from {@link ValueProvider} registrations are not included, as they are not cached.
   *
   * Note that only this container is affected. Parent containers, if any, remain unchanged.
   */
  resetRegistry(): unknown[];

  /**
   * Returns whether the token is registered in this container or in parent containers, if any.
   */
  isRegistered(token: Token): boolean;

  /**
   * Registers a {@link ClassProvider}, using the class itself as its token.
   *
   * Tokens provided to the {@link Injectable} decorator applied to the class
   * are also registered as aliases. The scope is determined by the {@link Scoped}
   * decorator, if present.
   */
  register<Instance extends object>(Class: Constructor<Instance>): this;

  /**
   * Registers a {@link ClassProvider} with a token.
   */
  register<Instance extends object, ProviderInstance extends Instance>(
    token: Token<Instance>,
    provider: ClassProvider<ProviderInstance>,
    options?: RegistrationOptions,
  ): this;

  /**
   * Registers a {@link FactoryProvider} with a token.
   */
  register<Value, ProviderValue extends Value>(
    token: Token<Value>,
    provider: FactoryProvider<ProviderValue>,
    options?: RegistrationOptions,
  ): this;

  /**
   * Registers an {@link ExistingProvider} with a token.
   *
   * The token will alias the one set in `useExisting`.
   */
  register<Value, ProviderValue extends Value>(
    token: Token<Value>,
    provider: ExistingProvider<ProviderValue>,
  ): this;

  /**
   * Registers a {@link ValueProvider} with a token.
   *
   * Values provided via `useValue` are never cached (scopes do not apply)
   * and are simply returned as-is.
   */
  register<Value, ProviderValue extends Value>(
    token: Token<Value>,
    provider: ValueProvider<ProviderValue>,
  ): this;

  /**
   * Removes all registrations for the given token from the container's internal registry.
   *
   * Returns an array of distinct cached values that were stored within the removed registrations.
   * Values from {@link ValueProvider} registrations are not included, as they are not cached.
   *
   * Note that only this container is affected. Parent containers, if any, remain unchanged.
   */
  unregister<Value>(token: Token<Value>): Value[];

  /**
   * Resolves the given class to the instance associated with it.
   *
   * If the class is registered in this container or any of its parent containers,
   * an instance is created using the most recent registration.
   *
   * If the class is not registered, but it is decorated with {@link AutoRegister},
   * or {@link ContainerOptions.autoRegister} is true, the class is registered automatically.
   * Otherwise, resolution fails.
   * The scope for the automatic registration is determined by either
   * the {@link Scoped} decorator on the class, or {@link ContainerOptions.defaultScope}.
   *
   * If `optional` is false or is not passed and the class is not registered in the container
   * (and could not be auto-registered), an error is thrown.
   * Otherwise, if `optional` is true, `undefined` is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the class is registered with _container_ scope, the resolved instance is cached
   * in the container's internal registry.
   */
  resolve<Instance extends object>(Class: Constructor<Instance>, optional?: false): Instance;
  resolve<Instance extends object>(Class: Constructor<Instance>, optional: true): Instance | undefined;
  resolve<Instance extends object>(Class: Constructor<Instance>, optional: boolean): Instance | undefined;

  /**
   * Resolves the given token to the value associated with it.
   *
   * If the token is registered in this container or any of its parent containers,
   * its value is resolved using the most recent registration.
   *
   * If `optional` is false or not passed and the token is not registered in the container,
   * an error is thrown. Otherwise, if `optional` is true, `undefined` is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with _container_ scope, the resolved value is cached
   * in the container's internal registry.
   */
  resolve<Value>(token: Token<Value>, optional?: false): Value;
  resolve<Value>(token: Token<Value>, optional: true): Value | undefined;
  resolve<Value>(token: Token<Value>, optional: boolean): Value | undefined;

  /**
   * Resolves the given class to all instances provided by the registrations associated with it.
   *
   * If the class is not registered, but it is decorated with {@link AutoRegister},
   * or {@link ContainerOptions.autoRegister} is true, the class is registered automatically.
   * Otherwise, resolution fails.
   * The scope for the automatic registration is determined by either
   * the {@link Scoped} decorator on the class, or {@link ContainerOptions.defaultScope}.
   *
   * If `optional` is false or is not passed and the class is not registered in the container
   * (and could not be auto-registered), an error is thrown.
   * Otherwise, if `optional` is true, an empty array is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the class is registered with _container_ scope, the resolved instances are cached
   * in the container's internal registry.
   *
   * A separate instance of the class is created for each provider.
   *
   * @see The documentation for `resolve(Class: Constructor)`
   */
  resolveAll<Instance extends object>(Class: Constructor<Instance>, optional?: false): Instance[];
  resolveAll<Instance extends object>(Class: Constructor<Instance>, optional: true): Instance[];
  resolveAll<Instance extends object>(Class: Constructor<Instance>, optional: boolean): Instance[];

  /**
   * Resolves the given token to all values provided by the registrations associated with it.
   *
   * If `optional` is false or not passed and the token is not registered in the container,
   * an error is thrown. Otherwise, if `optional` is true, an empty array is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with _container_ scope, the resolved values are cached
   * in the container's internal registry.
   *
   * @see The documentation for `resolve(token: Token)`
   */
  resolveAll<Value>(token: Token<Value>, optional?: false): NonNullable<Value>[];
  resolveAll<Value>(token: Token<Value>, optional: true): NonNullable<Value>[];
  resolveAll<Value>(token: Token<Value>, optional: boolean): NonNullable<Value>[];

  /**
   * Disposes this container and all its cached values.
   *
   * Token values implementing a `Disposable` interface (e.g., objects with a `dispose()` function)
   * are automatically disposed during this process.
   *
   * Note that children containers are disposed first, in creation order.
   */
  dispose(): void;
}

/**
 * Creates a new container.
 */
export function createContainer(
  options: Partial<ContainerOptions> = {
    autoRegister: false,
    defaultScope: Scope.Inherited,
  },
): Container {
  return new DefaultContainer(undefined, options);
}
