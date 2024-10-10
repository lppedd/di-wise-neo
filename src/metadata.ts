import type {InjectionConfig} from './config'
import type {Resolvable} from './resolvable'
import type {Constructor} from './token'

export interface InjectionMetadata<T = any> extends InjectionConfig<T[]> {
  dependencies: Set<InjectionDependency>
}

export interface InjectionDependency<T = any> {
  resolvable: Resolvable<T>
  setValue(instance: any, value: T): void
}

class InjectionMetadataRegistry {
  private readonly map = new WeakMap<DecoratorMetadata, InjectionMetadata>()

  get<T>(key: DecoratorMetadata): InjectionMetadata<T> | undefined {
    return this.map.get(key)
  }

  ensure<T>(key: DecoratorMetadata): InjectionMetadata<T> {
    let metadata = this.map.get(key)
    if (!metadata) {
      metadata = {tokens: [], dependencies: new Set()}
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
  return decoratorMetadata && metadataRegistry.get<T>(decoratorMetadata)
}
