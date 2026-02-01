import { check } from "./errors";
import type { Scope } from "./scope";
import type { Constructor } from "./token";
import { type ClassRef, isClassRef, type TokenRef } from "./tokenRef";
import type { ConstructorProvider, Dependencies, MethodDependency } from "./tokenRegistry";
import type { Writable } from "./utils/writable";

// @internal
export interface ScopeMetadata {
  readonly value: Scope;
  readonly appliedBy: "Scoped" | "EagerInstantiate";
}

// @internal
export class Metadata<This extends object> {
  readonly provider: Writable<ConstructorProvider<This>>;
  readonly dependencies: Dependencies = {
    ctor: [],
    methods: new Map(),
  };

  eagerInstantiate?: boolean | undefined;
  autoRegister?: boolean | undefined;
  scope?: ScopeMetadata;
  tokenRef: TokenRef<This> = {
    getRefToken: () => check(false, "internal: unexpected getRefToken call"),
    getRefTokens: () => new Set(),
  };

  constructor(Class: Constructor<This>) {
    this.provider = {
      useClass: Class,
    };
  }

  get name(): string | undefined {
    return this.provider.name;
  }

  set name(name: string) {
    this.provider.name = name;
  }

  getCtorDependency(index: number): MethodDependency {
    const i = this.dependencies.ctor.findIndex((d) => d.index === index);

    if (i > -1) {
      return this.dependencies.ctor[i]!;
    }

    const dependency: MethodDependency = {
      index: index,
    };

    this.dependencies.ctor.push(dependency);
    return dependency;
  }

  getMethodDependency(method: string | symbol, index: number): MethodDependency {
    let methodDeps = this.dependencies.methods.get(method);

    if (!methodDeps) {
      this.dependencies.methods.set(method, (methodDeps = []));
    }

    const i = methodDeps.findIndex((d) => d.index === index);

    if (i > -1) {
      return methodDeps[i]!;
    }

    const dependency: MethodDependency = {
      index: index,
    };

    methodDeps.push(dependency);
    return dependency;
  }
}

// @internal
export function getMetadata<T extends object>(classOrRef: Constructor<T> | ClassRef<T>): Metadata<T> {
  const Class = isClassRef(classOrRef) ? classOrRef.getRefClass() : classOrRef;
  const originalClass = classIdentityMap.get(Class) ?? Class;
  let metadata = metadataMap.get(originalClass);

  if (!metadata) {
    metadataMap.set(originalClass, (metadata = new Metadata(originalClass)));
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
    metadata.provider.useClass = Class;
  }

  return metadata;
}

/**
 * Registers a mapping between a generated (e.g., decorated or proxied) constructor
 * and its original, underlying constructor.
 *
 * This allows libraries or consumers that manipulate constructors, such as through
 * class decorators, to inform the DI system about the real "identity" of a class.
 *
 * **IMPORTANT**:
 * this API affects the core class identity resolution mechanism of the DI system.
 * Incorrect usage may cause metadata to be misassociated, leading to subtle errors.
 * Use only when manipulating constructors (e.g., via decorators or proxies),
 * and ensure the mapping is correct.
 *
 * @param transformedClass - The constructor function returned by a class decorator or factory.
 * @param originalClass - The original constructor function.
 */
export function setClassIdentityMapping<T extends object>(transformedClass: Constructor<T>, originalClass: Constructor<T>): void {
  classIdentityMap.set(transformedClass, originalClass);
}

const classIdentityMap = new WeakMap<Constructor<object>, Constructor<object>>();
const metadataMap = new WeakMap<Constructor<object>, Metadata<any>>();
