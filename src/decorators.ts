import {assert, ErrorMessages} from './errors'
import {inject} from './inject'
import {
  type Injection,
  type InjectionBindings,
  type InjectionCollection,
  metadataRegistry,
} from './metadata'
import type {Resolvable} from './resolver'
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
  return (_value, context) => {
    const metadata = metadataRegistry.ensure(context.metadata)
    const injections: InjectionBindings = (metadata.injections ||= new Map())
    const injection: Injection<T> = {
      resolvable,
      getValue: context.access.get,
      setValue: context.access.set,
    }
    injections.set(context.name, injection)
    return (initialValue: T): T => {
      if (metadata.deferredInjections?.has(injection)) {
        return initialValue
      }
      return inject(resolvable)
    }
  }
}

export function Deferred<T>(): ClassFieldDecorator<T> {
  return (_value, context) => {
    const metadata = metadataRegistry.get(context.metadata)
    const injection = metadata?.injections?.get(context.name)
    assert(injection, ErrorMessages.DeferredWithoutInject, context.name)
    const deferredInjections: InjectionCollection = (metadata!.deferredInjections ||= new Set())
    deferredInjections.add(injection)
  }
}
