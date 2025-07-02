import type { ClassProvider } from "./provider";
import type { Scope } from "./scope";
import type { Constructor } from "./token";
import type { Dependencies } from "./tokenRegistry";
import type { TokensRef } from "./tokensRef";

// @internal
export interface ScopeMetadata {
  readonly value: Scope;
  readonly appliedBy: "Scoped" | "EagerInstantiate";
}

// @internal
export interface Metadata<This extends object = any> {
  eagerInstantiate?: boolean;
  autoRegister?: boolean;
  scope?: ScopeMetadata;
  tokensRef: TokensRef<This>;
  provider: ClassProvider<This>;
  dependencies: Dependencies;
}

/**
 * Registers a mapping between a generated (e.g., decorated or proxied) constructor
 * and its original, underlying constructor.
 *
 * This allows libraries or consumers that manipulate constructors, such as through
 * class decorators, to inform the DI system about the real "identity" of a class.
 *
 * @param transformedClass The constructor function returned by a class decorator or factory.
 * @param originalClass The original constructor function.
 *
 * @remarks
 * This API affects the core class identity resolution mechanism of the DI system.
 * Incorrect usage may cause metadata to be misassociated, leading to subtle errors.
 * Use only when manipulating constructors (e.g., via decorators or proxies),
 * and ensure the mapping is correct.
 */
export function setClassIdentityMapping<T extends object>(
  transformedClass: Constructor<T>,
  originalClass: Constructor<T>,
): void {
  classIdentityMap.set(transformedClass, originalClass);
}

// @internal
export function getMetadata<T extends object>(Class: Constructor<T>): Metadata<T> {
  const originalClass = classIdentityMap.get(Class) ?? Class;
  let metadata = metadataMap.get(originalClass);

  if (!metadata) {
    metadataMap.set(
      originalClass,
      (metadata = {
        tokensRef: {
          getRefTokens: () => new Set(),
        },
        provider: {
          useClass: originalClass,
        },
        dependencies: {
          constructor: [],
          methods: new Map(),
        },
      }),
    );
  }

  if (metadata.provider.useClass !== Class) {
    // This is part of the class identity mapping API (see setClassIdentityMapping).
    //
    // Scenario:
    // 1. Metadata is created for class A (the original class) because of a parameter decorator.
    // 2. Later, because of a class decorator that extends the decorated class, a third-party
    //    registers a class identity mapping from class B to class A, where B is the class
    //    generated from the class decorator by extending A.
    //
    // We must update useClass to be the extender class B so that instances created by the
    // DI container match the consumer's registered class. Without this update, the DI
    // system would instantiate the original class A, causing behavior inconsistencies.
    //
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (metadata.provider as any).useClass = Class;
  }

  return metadata;
}

const classIdentityMap = new WeakMap<Constructor<object>, Constructor<object>>();
const metadataMap = new WeakMap<Constructor<object>, Metadata>();
