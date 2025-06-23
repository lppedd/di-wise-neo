import { DefaultContainer } from "./defaultContainer";
import type { ClassProvider, ExistingProvider, FactoryProvider, ValueProvider } from "./provider";
import type { RegistrationOptions, Registry } from "./registry";
import { Scope } from "./scope";
import type { Constructor, Token, TokenList } from "./token";

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
  readonly registry: Registry;

  /**
   * Whether this container is disposed.
   */
  readonly isDisposed: boolean;

  /**
   * Returns the parent container, if any.
   */
  getParent(): Container | undefined;

  /**
   * Creates a child container with the same configuration.
   */
  createChild(): Container;

  /**
   * Clears and returns all distinct cached values from this container's internal registry.
   * Values from {@link ValueProvider} registrations are not included, as they are never cached.
   *
   * Note that this only affects this container. The parent containers, if any, are not affected.
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
   * Note that this only affects this container. The parent containers, if any, are not affected.
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
   * Note that this only affects this container. The parent containers, if any, are not affected.
   */
  unregister<Value>(token: Token<Value>): Value[];

  /**
   * Resolves a class token to a single instance.
   *
   * If the class is registered in this container or any of its parent containers,
   * an instance is created using the most recent registration.
   *
   * If the class is not registered and {@link ContainerOptions.autoRegister} is true,
   * it is registered automatically. Otherwise, the resolution fails.
   *
   * The scope for the automatic registration is determined by either
   * {@link ContainerOptions.defaultScope} or the {@link Scoped} decorator on the class.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope (see just below).
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the token is registered with _container_ scope, the resolved instance
   * is cached in the container's internal registry.
   */
  resolve<Instance extends object>(Class: Constructor<Instance>): Instance;

  /**
   * Resolves a token to its value.
   *
   * If the token is registered in this container or any of its parent containers,
   * its value is resolved using the most recent registration.
   *
   * If the token is not registered, the resolution fails.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope (see just below).
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with _container_ scope, the resolved value
   * is cached in the container's internal registry.
   */
  resolve<Value>(token: Token<Value>): Value;

  /**
   * Resolves a token to its value by sequentially checking each token in the provided list
   * until a registered one is found: if the first token is not registered, resolution moves
   * to the next token, and so on.
   *
   * If none of the tokens are registered, resolution fails.
   *
   * If one of the tokens is registered in this container or any of its parent containers,
   * its value is resolved using the most recent registration.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope (see just below).
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * If the token is registered with _container_ scope, the resolved value
   * is cached in the container's internal registry.
   */
  resolve<Values extends [unknown, ...unknown[]]>(...tokens: TokenList<Values>): Values[number];

  /**
   * Resolves a class token to the instances created by all its registered providers.
   *
   * If no providers are registered for the token, an empty array is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided instance is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the instance.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope (see just below).
   * - For {@link ExistingProvider}, the instance is resolved by referring to another registered token.
   *
   * If the token is registered with _container_ scope, the resolved instance
   * is cached in the container's internal registry.
   *
   * A separate instance of the class is created for each provider.
   *
   * @see The documentation for `resolve(Class: Constructor)`
   */
  resolveAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Resolves a token to the values created by all its registered providers.
   *
   * If no providers are registered for the token, an empty array is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * @see The documentation for `resolve(token: Token)`
   */
  resolveAll<Value>(token: Token<Value>): NonNullable<Value>[];

  /**
   * Resolves a token to the values created by all its registered providers by sequentially checking
   * each token in the provided list until a registered one is found: if the first token is not
   * registered, resolution moves to the next token, and so on.
   *
   * If none of the tokens are registered, an empty array is returned.
   *
   * The resolution behavior depends on the {@link Provider} used during registration:
   * - For {@link ValueProvider}, the explicitly provided value is returned.
   * - For {@link FactoryProvider}, the factory function is invoked to create the value.
   * - For {@link ClassProvider}, a new instance of the class is created according to its scope.
   * - For {@link ExistingProvider}, the value is resolved by referring to another registered token.
   *
   * @see The documentation for `resolve(...tokens: TokenList)`
   */
  resolveAll<Values extends [unknown, ...unknown[]]>(
    ...tokens: TokenList<Values>
  ): NonNullable<Values[number]>[];

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
