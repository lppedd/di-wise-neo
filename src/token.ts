/**
 * Type API.
 */
export interface Type<T> {
  /**
   * The name of the type.
   */
  readonly name: string;

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
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createType<T>(typeName: string): Type<T> {
  const name = `Type<${typeName}>`;
  return <Type<T>>{
    name: name,
    toString: () => name,
  };
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>): token is Constructor<T & object> {
  return typeof token === "function";
}
