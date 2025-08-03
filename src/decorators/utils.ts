// SPDX-License-Identifier: MIT

import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import type { MethodDependency } from "../tokenRegistry";

// @internal
export function updateParameterMetadata(
  decorator: string,
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
  updateFn: (dependency: MethodDependency) => void,
): void {
  // Error out immediately if the decorator has been applied to a static method
  if (propertyKey !== undefined && typeof target === "function") {
    assert(false, `@${decorator} cannot be used on static method ${target.name}.${String(propertyKey)}`);
  }

  if (propertyKey === undefined) {
    // Constructor
    const metadata = getMetadata(target as Constructor<any>);
    const dependency = metadata.getConstructorDependency(parameterIndex);
    updateFn(dependency);
  } else {
    // Instance method
    const metadata = getMetadata(target.constructor as Constructor<any>);
    const dependency = metadata.getMethodDependency(propertyKey, parameterIndex);
    updateFn(dependency);
  }
}
