import type {InjectionProvider} from "./provider";
import type {Registration} from "./registry";
import type {InjectionScope} from "./scope";
import type {Constructor, InjectionToken} from "./token";

export interface InjectionMetadata<This extends object = any> {
  autoRegister?: boolean;
  scope?: InjectionScope;
  tokens: InjectionToken<This>[];
  provider: InjectionProvider<This>;
}

class InjectionMetadataRegistry {
  private map = new WeakMap<Constructor<object>, InjectionMetadata>();

  ensure<T extends object>(Class: Constructor<T>): InjectionMetadata<T> {
    let metadata = this.map.get(Class);
    if (!metadata) {
      metadata = {
        tokens: [],
        provider: {useClass: Class},
      };
      this.map.set(Class, metadata);
    }
    return metadata;
  }
}

const metadataRegistry = new InjectionMetadataRegistry();

// @internal
export function getMetadata<T extends object>(Class: Constructor<T>) {
  return metadataRegistry.ensure<T>(Class);
}

// @internal
export function getRegistration<T extends object>(metadata: InjectionMetadata<T>): Registration<T> {
  return {
    provider: metadata.provider,
    options: {scope: metadata.scope},
  };
}
