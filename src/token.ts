export type TokenList<Values extends unknown[]> =
  {[Index in keyof Values]: Token<Values[Index]>};

export type Token<Value = any> = Value extends object
  ? Type<Value> | Constructor<Value>
  : Type<Value>;

export interface Type<T> {
  readonly name: string;
  inter<I>(typeName: string, I: Type<I>): Type<T & I>;
  union<U>(typeName: string, U: Type<U>): Type<T | U>;
}

/*@__NO_SIDE_EFFECTS__*/
export function Type<T>(typeName: string): Type<T> {
  const name = `Type<${typeName}>`;
  const type = {
    name,
    inter: Type,
    union: Type,
    toString() {
      return this.name;
    },
  };
  return type;
}

export declare namespace Type {
  export var Null: typeof TypeNull;
  export var Undefined: typeof TypeUndefined;
}

export const TypeNull: Type<null> = Type("null");
export const TypeUndefined: Type<undefined> = Type("undefined");

Type.Null = TypeNull;
Type.Undefined = TypeUndefined;

export interface Constructor<Instance extends object> {
  new (...args: []): Instance;
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>) {
  return typeof token == "function";
}
