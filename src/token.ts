import type { Provider } from "./provider";
import type { RegistrationOptions } from "./tokenRegistry";

/**
 * An injectable type `T`.
 */
export interface Type<T> {
  /**
   * The name of the type.
   */
  readonly name: string;

  /**
   * Returns the stringified representation of the type.
   */
  toString: () => string;

  /**
   * Ensures that different `Type<T>` types are not structurally compatible.
   *
   * This property is never used at runtime.
   *
   * @private
   */
  readonly __type?: T;
}

/**
 * An injectable type `T` with a default {@link Provider} and optional default registration options.
 */
export interface ProviderType<T> extends Type<T> {
  /**
   * The type's default provider.
   */
  readonly provider: Provider<T>;

  /**
   * The type's default registration options.
   */
  readonly options?: RegistrationOptions;
}

/**
 * Constructor type.
 */
export interface Constructor<Instance extends object> {
  new (...args: any[]): Instance;
  readonly name: string;
}

/**
 * Token type.
 */
export type Token<Value = any> = [Value] extends [object] // Avoids distributive union behavior
  ? Type<Value> | Constructor<Value>
  : Type<Value>;

/**
 * Describes a {@link Token} array with at least one element.
 */
export type Tokens<Value = any> = [Token<Value>, ...Token<Value>[]];

/**
 * Creates a type token.
 *
 * @example
 * ```ts
 * const ISpell = createType<Spell>("Spell");
 * container.register(ISpell, {
 *   useFactory: () => getDefaultSpell(),
 * });
 * ```
 */
export function createType<T>(typeName: string): Type<T>;

/**
 * Creates a type token with a default {@link Provider} and optional default registration options.
 *
 * @example
 * ```ts
 * // Notice how we pass in a Provider directly at type creation site
 * const ISpell = createType<Spell>("Spell", {
 *   useFactory: () => getDefaultSpell(),
 * });
 *
 * container.register(ISpell);
 * ```
 */
export function createType<T>(typeName: string, provider: Provider<T>, options?: RegistrationOptions): ProviderType<T>;

// @internal
// @__NO_SIDE_EFFECTS__
export function createType<T>(
  typeName: string,
  provider?: Provider<T>,
  options?: RegistrationOptions,
): Type<T> | ProviderType<T> {
  const name = `Type<${typeName}>`;
  const toString = (): string => name;
  return provider //
    ? { name, provider, options, toString }
    : { name, toString };
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>): token is Constructor<T & object> {
  return typeof token === "function";
}
