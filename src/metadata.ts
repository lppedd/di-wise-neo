import type { TokensRef } from "./decorators";
import type { ClassProvider } from "./provider";
import type { Dependencies } from "./registry";
import type { Scope } from "./scope";
import type { Constructor } from "./token";

export interface Metadata<This extends object = any> {
  autoRegister?: boolean;
  scope?: Scope;
  tokensRef: TokensRef<This>;
  provider: ClassProvider<This>;
  dependencies: Dependencies;
}

// @internal
export function getMetadata<T extends object>(Class: Constructor<T>): Metadata<T> {
  let metadata = metadataMap.get(Class);

  if (!metadata) {
    metadataMap.set(
      Class,
      (metadata = {
        tokensRef: {
          getRefTokens: () => new Set(),
        },
        provider: {
          useClass: Class,
        },
        dependencies: {
          constructor: [],
          properties: [],
          methods: new Map(),
        },
      }),
    );
  }

  return metadata;
}

const metadataMap = new WeakMap<Constructor<object>, Metadata>();
