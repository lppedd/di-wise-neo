import type {InjectionConfig} from './config'
import {inject} from './inject'
import {metadataRegistry} from './metadata'
import type {Resolvable} from './resolvable'
import type {InjectionScope} from './scope'
import type {Constructor, InjectionToken} from './token'

export type ClassDecorator<Class extends Constructor> = (
  value: Class,
  context: ClassDecoratorContext<Class>,
) => Class | void

export type ClassFieldDecorator<Value> = <This>(
  value: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => ClassFieldInitializer<This, Value> | void

export type ClassFieldInitializer<This, Value> = (
  this: This,
  initialValue: Value,
) => Value

export function Injectable<T>(...tokens: InjectionToken<T>[]): ClassDecorator<Constructor<T>> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure<T>(context.metadata)
    metadata.tokens.push(...tokens)
  }
}

export function Scoped<T>(scope: InjectionScope): ClassDecorator<Constructor<T>> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure<T>(context.metadata)
    metadata.scope = scope
  }
}

export function Inject<T extends any[]>(config: InjectionConfig<T>): ClassFieldDecorator<T[number]>
export function Inject<T>(token: InjectionToken<T>): ClassFieldDecorator<T>
export function Inject<T>(resolvable: Resolvable<T>): ClassFieldDecorator<T>
export function Inject<T>(resolvable: Resolvable<T>): ClassFieldDecorator<T> {
  return (_value, _context) => {
    return (_initialValue) => {
      return inject(resolvable)
    }
  }
}

export function Deferred<T extends any[]>(config: InjectionConfig<T>): ClassFieldDecorator<T[number]>
export function Deferred<T>(token: InjectionToken<T>): ClassFieldDecorator<T>
export function Deferred<T>(resolvable: Resolvable<T>): ClassFieldDecorator<T>
export function Deferred<T>(resolvable: Resolvable<T>): ClassFieldDecorator<T> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure<T>(context.metadata)
    metadata.dependencies.add({
      resolvable,
      setValue: context.access.set,
    })
  }
}
