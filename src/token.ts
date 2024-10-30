export type TokenList<Values extends unknown[]> =
  {[Index in keyof Values]: Token<Values[Index]>};

/**
 * Token type.
 */
export type Token<Value = any> = Value extends object
  ? Type<Value> | Constructor<Value>
  : Type<Value>;

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
    toString() {
      return type.name;
    },
  };
  return type;
}

export declare namespace Type {
  /**
   * Type token of `null`.
   *
   * @example
   * ```ts
   * container.resolve(Type.Null); // => null
   * ```
   */
  export var Null: Type<null>;

  /**
   * Type token of `undefined`.
   *
   * @example
   * ```ts
   * container.resolve(Type.Undefined); // => undefined
   * ```
   */
  export var Undefined: Type<undefined>;
}

Type.Null = Type("null") as Type<null>;
Type.Undefined = Type("undefined") as Type<undefined>;

/**
 * Constructor type.
 */
export interface Constructor<Instance extends object> {
  new (...args: []): Instance;
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>) {
  return typeof token == "function";
}
