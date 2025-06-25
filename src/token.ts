/**
 * Type API.
 */
export interface Type<A> {
  /**
   * Name of the type.
   */
  readonly name: string;

  /**
   * Create an intersection type from another type.
   *
   * @example
   * ```ts
   * const A = Type<A>("A");
   * const B = Type<B>("B");
   *
   * A.inter("I", B); // => Type<A & B>
   * ```
   */
  inter<B>(typeName: string, B: Type<B>): Type<A & B>;

  /**
   * Create a union type from another type.
   *
   * @example
   * ```ts
   * const A = Type<A>("A");
   * const B = Type<B>("B");
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
  readonly length: number;
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
 * Create a type token.
 *
 * @example
 * ```ts
 * const Spell = Type<Spell>("Spell");
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Type<T>(typeName: string): Type<T> {
  const type = {
    name: `Type<${typeName}>`,
    inter: Type,
    union: Type,
    toString(): string {
      return type.name;
    },
  };

  return type;
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>): token is Constructor<T & object> {
  return typeof token == "function";
}
