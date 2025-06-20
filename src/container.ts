import type { ContainerOptions } from "./containerOptions";
import { DefaultContainer } from "./defaultContainer";
import type { ClassProvider, FactoryProvider, ValueProvider } from "./provider";
import type { RegistrationOptions, Registry } from "./registry";
import { Scope } from "./scope";
import type { Constructor, Token, TokenList } from "./token";

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
   */
  get registry(): Registry;

  /**
   * Clear the cached instances with container scope.
   *
   * The registered constants with `ValueProvider` are not affected.
   */
  clearCache(): void;

  /**
   * Create a child container with the same configuration.
   */
  createChild(): Container;

  /**
   * Get the cached instance with container scope.
   */
  getCached<Value>(token: Token<Value>): Value | undefined;

  /**
   * Check if a token is registered in the container or its ancestors.
   */
  isRegistered(token: Token): boolean;

  /**
   * Register a `ClassProvider` with the token of the class itself.
   *
   * All the tokens specified in the `@Injectable` decorator are also registered.
   */
  register<Instance extends object>(Class: Constructor<Instance>): this;

  /**
   * Register a `ClassProvider` with a token.
   */
  register<Instance extends object>(
    token: Token<Instance>,
    provider: ClassProvider<Instance>,
    options?: RegistrationOptions,
  ): this;

  /**
   * Register a `FactoryProvider` with a token.
   */
  register<Value>(
    token: Token<Value>,
    provider: FactoryProvider<Value>,
    options?: RegistrationOptions,
  ): this;

  /**
   * Register a `ValueProvider` with a token.
   */
  register<Value>(token: Token<Value>, provider: ValueProvider<Value>): this;

  /**
   * Remove all registrations from the internal registry.
   */
  resetRegistry(): void;

  /**
   * Resolve a class token to an instance.
   */
  resolve<Instance extends object>(Class: Constructor<Instance>): Instance;

  /**
   * Resolve a token to an instance.
   */
  resolve<Value>(token: Token<Value>): Value;

  /**
   * Resolve a token to an instance, by checking each token in order until a registered one is found.
   */
  resolve<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];

  /**
   * Resolve a class token to instances with all registered providers.
   */
  resolveAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Resolve a token to instances with all registered providers.
   *
   * The returned array will not contain `null` or `undefined` values.
   */
  resolveAll<Value>(token: Token<Value>): NonNullable<Value>[];

  /**
   * Resolve a token to instances with all registered providers, by checking each token in order until a registered one is found.
   *
   * The returned array will not contain `null` or `undefined` values.
   */
  resolveAll<Values extends unknown[]>(...tokens: TokenList<Values>): NonNullable<Values[number]>[];

  /**
   * Remove a registration from the internal registry.
   */
  unregister(token: Token): this;
}

/**
 * Create a new container.
 */
export function createContainer(
  options: Partial<ContainerOptions> = {
    autoRegister: false,
    defaultScope: Scope.Inherited,
    parent: undefined,
  },
): Container {
  return new DefaultContainer(options);
}
