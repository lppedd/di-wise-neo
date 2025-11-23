import type { Constructor, Token } from "./token";
import type { ClassRef } from "./tokenRef";

/**
 * Provides a class instance for a token via a class constructor.
 */
export interface ClassProvider<Instance extends object> {
  /**
   * The class to instantiate for the token.
   */
  readonly useClass: Constructor<Instance> | ClassRef<Instance>;

  /**
   * An optional name to qualify this provider.
   * If specified, the token must be resolved using the same name.
   *
   * Equivalent to decorating the class with `@Named(...)`.
   *
   * @example
   * ```ts
   * export class ExtensionContext {
   *   // Decorator-based injection
   *   constructor(@Inject(ISecretStorage) @Named("persistent") secretStorage: SecretStorage) {}
   *
   *   // Function-based injection
   *   constructor(secretStorage = inject(ISecretStorage, "persistent")) {}
   * }
   * ```
   */
  readonly name?: string;
}

/**
 * Provides a value for a token via a factory function.
 */
export interface FactoryProvider<Value> {
  /**
   * A function that produces the value at resolution time.
   *
   * The function runs inside the injection context and can
   * access dependencies via {@link inject}-like helpers.
   */
  readonly useFactory: (...args: []) => Value;

  /**
   * An optional name to qualify this provider.
   * If specified, the token must be resolved using the same name.
   *
   * @example
   * ```ts
   * export class ExtensionContext {
   *   // Decorator-based injection
   *   constructor(@Inject(ISecretStorage) @Named("persistent") secretStorage: SecretStorage) {}
   *
   *   // Function-based injection
   *   constructor(secretStorage = inject(ISecretStorage, "persistent")) {}
   * }
   * ```
   */
  readonly name?: string;
}

/**
 * Provides a static - already constructed - value for a token.
 */
export interface ValueProvider<Value> {
  /**
   * The static value to associate with the token.
   */
  readonly useValue: Value;

  /**
   * An optional name to qualify this provider.
   * If specified, the token must be resolved using the same name.
   *
   * @example
   * ```ts
   * export class ExtensionContext {
   *   // Decorator-based injection
   *   constructor(@Inject(ISecretStorage) @Named("persistent") secretStorage: SecretStorage) {}
   *
   *   // Function-based injection
   *   constructor(secretStorage = inject(ISecretStorage, "persistent")) {}
   * }
   * ```
   */
  readonly name?: string;
}

/**
 * Aliases another registered token.
 *
 * Resolving this token will return the value of the aliased one.
 */
export interface ExistingProvider<Value> {
  /**
   * The existing token to alias, with an optional name qualifier.
   *
   * @example
   * ```ts
   * container.register(ISecretStorage, {
   *   useExisting: PersistentSecretStorage,
   * });
   *
   * // Or in case we need to alias a name-qualified token
   * container.register(ISecretStorage, {
   *   useExisting: [PersistentSecretStorage, "fileSystem"],
   * });
   * ```
   */
  readonly useExisting: Token<Value> | [Token<Value>, string?];

  /**
   * An optional name to qualify this provider.
   * If specified, the token must be resolved using the same name.
   *
   * @example
   * ```ts
   * export class ExtensionContext {
   *   // Decorator-based injection
   *   constructor(@Inject(ISecretStorage) @Named("persistent") secretStorage: SecretStorage) {}
   *
   *   // Function-based injection
   *   constructor(secretStorage = inject(ISecretStorage, "persistent")) {}
   * }
   * ```
   */
  readonly name?: string;
}

/**
 * A token provider.
 */
export type Provider<Value> =
  | ClassProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>
  | ExistingProvider<Value>;

// @internal
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T & object> {
  return "useClass" in provider;
}

// @internal
export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return "useFactory" in provider;
}

// @internal
export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "useValue" in provider;
}

// @internal
export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return "useExisting" in provider;
}
