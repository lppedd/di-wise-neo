import {inject} from './inject'
import type {Injections} from './injection'
import {metadataRegistry} from './metadata'
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

export function Injectable<This extends object>(...tokens: InjectionToken<This>[]): ClassDecorator<Constructor<This>> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure<This>(context.metadata)
    metadata.tokens.push(...tokens)
  }
}

export function Scoped<This extends object>(scope: InjectionScope): ClassDecorator<Constructor<This>> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure<This>(context.metadata)
    metadata.scope = scope
  }
}

export function Inject<Values extends unknown[]>(...injections: Injections<Values>): ClassFieldDecorator<Values[number]> {
  return (_value, _context) => {
    return (_initialValue) => {
      return inject(...injections)
    }
  }
}

export function Deferred<Values extends unknown[]>(...injections: Injections<Values>): ClassFieldDecorator<Values[number]> {
  return (_value, context) => {
    const metadata = metadataRegistry.ensure(context.metadata)
    metadata.dependencies.add({
      injections,
      setValue: context.access.set,
    })
  }
}
