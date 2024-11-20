import type {ClassProvider} from "./provider";
import type {Scope} from "./scope";
import type {Constructor, Token} from "./token";

export interface Metadata<This extends object = any> {
  autoRegister?: boolean;
  scope?: Scope;
  tokens: Token<This>[];
  provider: ClassProvider<This>;
}

// @internal
export function getMetadata<T extends object>(Class: Constructor<T>): Metadata<T> {
  let metadata = metadataRegistry.get(Class);
  if (!metadata) {
    metadataRegistry.set(Class, metadata = {
      tokens: [],
      provider: {useClass: Class},
    });
  }
  return metadata;
}

const metadataRegistry = new WeakMap<Constructor<object>, Metadata>();
