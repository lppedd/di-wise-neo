import type {InjectionConfig} from './config'
import type {Resolvable} from './resolver'
import type {Constructor} from './token'

export interface InjectionMetadata<T = any> extends Partial<InjectionConfig<T>> {
  dependencies: Set<InjectionDependency>
}

export interface InjectionDependency<T = any> {
  resolvable: Resolvable<T>
  setValue(instance: any, value: T): void
}

class InjectionMetadataRegistry {
  private readonly map = new WeakMap<DecoratorMetadata, InjectionMetadata>()

  get(key: DecoratorMetadata) {
    return this.map.get(key)
  }

  ensure(key: DecoratorMetadata) {
    let metadata = this.map.get(key)
    if (!metadata) {
      metadata = {dependencies: new Set()}
      this.map.set(key, metadata)
    }
    return metadata
  }
}

/** @internal */
export const metadataRegistry = new InjectionMetadataRegistry()

/** @internal */
export function getMetadata<T>(Class: Constructor<T>) {
  const decoratorMetadata = Class[Symbol.metadata]
  return decoratorMetadata && metadataRegistry.get(decoratorMetadata)
}
