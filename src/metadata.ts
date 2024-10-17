import type {Provider} from "./provider";
import type {Registration} from "./registry";
import type {Scope} from "./scope";
import type {Constructor, Token} from "./token";

export interface Metadata<This extends object = any> {
  autoRegister?: boolean;
  scope?: Scope;
  tokens: Token<This>[];
  provider: Provider<This>;
}

class MetadataRegistry {
  private map = new WeakMap<Constructor<object>, Metadata>();

  ensure<T extends object>(Class: Constructor<T>): Metadata<T> {
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

const metadataRegistry = new MetadataRegistry();

// @internal
export function getMetadata<T extends object>(Class: Constructor<T>) {
  return metadataRegistry.ensure<T>(Class);
}

// @internal
export function getRegistration<T extends object>(metadata: Metadata<T>): Registration<T> {
  return {
    provider: metadata.provider,
    options: {scope: metadata.scope},
  };
}
