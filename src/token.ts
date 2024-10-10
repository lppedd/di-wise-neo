export type InjectionToken<T = any> = Constructor<T> | Type<T>

export interface Constructor<T> {
  new (...args: []): T
}

export interface Type<T> {
  readonly name: string
  inter<I>(typeName: string, I: Type<I>): Type<T & I>
  union<U>(typeName: string, U: Type<U>): Type<T | U>
}

export function Type<T>(typeName: string): Type<T> {
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
