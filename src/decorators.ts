import {inject} from './inject'
import {metadataRegistry} from './metadata'
import type {Resolvable} from './resolvable'
import type {InjectionScope} from './scope'
import type {Constructor, InjectionToken} from './token'

export type ClassDecorator<Class extends Constructor<object>> = (
  value: Class,
  context: ClassDecoratorContext<Class>,
) => Class | void

export type ClassFieldDecorator<Value> = <This extends object>(
  value: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => ClassFieldInitializer<This, Value> | void

export type ClassFieldInitializer<This extends object, Value> = (
  this: This,
  initialValue: Value,
) => Value

export function Injectable<T extends object>(token: InjectionToken<T>): ClassDecorator<Constructor<T>> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure(context.metadata)
    metadata.token = token
  }
}

export function Scoped(scope: InjectionScope): ClassDecorator<Constructor<object>> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure(context.metadata)
    metadata.scope = scope
  }
}

export function Inject<T>(resolvable: Resolvable<T>): ClassFieldDecorator<T> {
  return (_value, _context) => {
    return (_initialValue) => {
      return inject(resolvable)
    }
  }
}

export function Deferred<T>(resolvable: Resolvable<T>): ClassFieldDecorator<T> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure(context.metadata)
    metadata.dependencies.add({
      resolvable,
      setValue: context.access.set,
    })
  }
}
