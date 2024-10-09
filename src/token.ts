export type InjectionToken<T = any> = Constructor<T> | InjectableType<T>

export interface Constructor<T> {
  new (...args: []): T & object
}

export interface InjectableType<T> {
  readonly name: string
  inter<I>(typeName: string, I: InjectableType<I>): InjectableType<T & I>
  union<U>(typeName: string, U: InjectableType<U>): InjectableType<T | U>
}

export function InjectableType<T>(typeName: string): InjectableType<T> {
  return {
    name: typeName,
    inter: InjectableType,
    union: InjectableType,
  }
}

/** @internal */
export function isConstructor<T>(token: InjectionToken<T>) {
  return typeof token == 'function'
}
