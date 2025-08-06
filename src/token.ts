/**
 * Type API.
 */
export interface Type<A> {
  /**
   * The name of the type.
   */
  readonly name: string;

  /**
   * Creates an intersection type from another type.
   *
   * @example
   * ```ts
   * const A = createType<A>("A");
   * const B = createType<B>("B");
   *
   * A.inter("I", B); // => Type<A & B>
   * ```
   */
  inter<B>(typeName: string, B: Type<B>): Type<A & B>;

  /**
   * Creates a union type from another type.
   *
   * @example
   * ```ts
   * const A = createType<A>("A");
   * const B = createType<B>("B");
   *
   * A.union("U", B); // => Type<A | B>
   * ```
   */
  union<B>(typeName: string, B: Type<B>): Type<A | B>;
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
  const type = {
    name: `Type<${typeName}>`,
    inter: createType,
    union: createType,
    toString(): string {
      return type.name;
    },
  };

  return type;
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>): token is Constructor<T & object> {
  return typeof token === "function";
}
