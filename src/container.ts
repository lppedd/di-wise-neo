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
   * The underlying registry.
   *
   * @internal
   */
  readonly registry: Registry;

  /**
   * Whether the container is disposed.
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
   * Clears the cached values with container scope from the container's internal registry.
   *
   * Values of registrations created via {@link ValueProvider} are not affected, as they are not cached.
   *
   * Note that this only affects the current container. The parent container, if any, is not affected.
   */
  clearCache(): unknown[];

  /**
   * Gets the cached value for the token with container scope.
   */
  getCached<Value>(token: Token<Value>): Value | undefined;

  /**
   * Removes all registrations from the container's internal registry.
   *
   * Returns an array of unique cached instances that were associated with the removed registrations.
   * Values of registrations created via {@link ValueProvider} are not included in the array, as they are not cached.
   *
   * Note that this only affects the current container. The parent container, if any, is not affected.
   */
  resetRegistry(): unknown[];

  /**
   * Returns whether the token is registered in the container or its parent containers.
   */
  isRegistered(token: Token): boolean;

  /**
   * Registers a {@link ClassProvider} with the token of the class itself.
   *
   * All tokens specified in the {@link Injectable} decorator are also registered.
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
  register<Value>(
    token: Token<Value>,
    provider: FactoryProvider<Value>,
    options?: RegistrationOptions,
  ): this;

  /**
   * Registers an {@link ExistingProvider} with a token.
   */
  register<Value>(
    token: Token<Value>,
    provider: ExistingProvider<Value>,
    options?: RegistrationOptions,
  ): this;

  /**
   * Registers a {@link ValueProvider} with a token.
   */
  register<Value>(token: Token<Value>, provider: ValueProvider<Value>): this;

  /**
   * Removes all registrations for the given token from the container's internal registry.
   *
   * Returns an array of unique cached instances that were associated with the removed registrations.
   * Values of registrations created via {@link ValueProvider} are not included in the array, as they are not cached.
   *
   * Note that this only affects the current container. The parent container, if any, is not affected.
   */
  unregister<Value>(token: Token<Value>): NonNullable<Value>[];

  /**
   * Resolves a class token to an instance.
   */
  resolve<Instance extends object>(Class: Constructor<Instance>): Instance;

  /**
   * Resolves a token to an instance.
   */
  resolve<Value>(token: Token<Value>): Value;

  /**
   * Resolves a token to an instance, by checking each token in order until a registered one is found.
   */
  resolve<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];

  /**
   * Resolves a class token to instances with all registered providers.
   */
  resolveAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Resolves a token to instances with all registered providers.
   *
   * The returned array _will not_ contain `null` or `undefined` values.
   */
  resolveAll<Value>(token: Token<Value>): NonNullable<Value>[];

  /**
   * Resolves a token to instances with all registered providers, by checking each token in order until a registered one is found.
   *
   * The returned array _will not_ contain `null` or `undefined` values.
   */
  resolveAll<Values extends unknown[]>(...tokens: TokenList<Values>): NonNullable<Values[number]>[];

  /**
   * Disposes the container, and all its currently instantiated classes/tokens.
   *
   * Children containers are disposed first, in creation order.
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
