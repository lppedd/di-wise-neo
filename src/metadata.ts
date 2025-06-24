import type { ClassProvider } from "./provider";
import type { Dependencies } from "./registry";
import type { Scope } from "./scope";
import type { Constructor, Token } from "./token";

export interface Metadata<This extends object = any> {
  autoRegister?: boolean;
  scope?: Scope;
  tokens: Set<Token<This>>;
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
        tokens: new Set(),
        provider: {
          useClass: Class,
        },
        dependencies: {
          properties: [],
        },
      }),
    );
  }

  return metadata;
}

const metadataMap = new WeakMap<Constructor<object>, Metadata>();
