import type {InjectionConfig} from './config'
import type {Resolvable} from './resolver'
import type {Constructor} from './token'

export interface InjectionMetadata<T = any> extends Partial<InjectionConfig<T>> {
  injections?: InjectionBindings
  deferredInjections?: InjectionCollection
}

export type InjectionBindings = Map<string | symbol, Injection>

export type InjectionCollection = Set<Injection>

export interface Injection<T = any> {
  resolvable: Resolvable<T>
  getValue(instance: object): T
  setValue(instance: object, value: T): void
}

/** @internal */
export class InjectionMetadataRegistry {
  private readonly map = new WeakMap<DecoratorMetadata, InjectionMetadata>()

  get(key: DecoratorMetadata) {
    return this.map.get(key)
  }

  ensure(key: DecoratorMetadata) {
    let value = this.map.get(key)
    if (!value) {
      value = {}
      this.map.set(key, value)
    }
    return value
  }
}

/** @internal */
export const metadataRegistry = new InjectionMetadataRegistry()

/** @internal */
export function getMetadata<T>(Class: Constructor<T>) {
  const decoratorMetadata = Class[Symbol.metadata]
  return decoratorMetadata && metadataRegistry.get(decoratorMetadata)
}
