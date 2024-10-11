export type InjectionToken<Value = any> = Constructor<Value & object> | Type<Value>

export interface Constructor<Instance extends object> {
  new (...args: []): Instance
}

export interface Type<Value> {
  readonly name: string
  inter<I>(typeName: string, I: Type<I>): Type<Value & I>
  union<U>(typeName: string, U: Type<U>): Type<Value | U>
}

export function Type<Value>(typeName: string): Type<Value> {
  return {
    name: typeName,
    inter: Type,
    union: Type,
  }
}

/** @internal */
export function isConstructor(token: unknown) {
  return typeof token == 'function'
}
