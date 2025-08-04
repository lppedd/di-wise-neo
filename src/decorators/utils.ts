import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import type { InjectDecorator, MethodDependency } from "../tokenRegistry";

// @internal
export function updateParameterMetadata(
  decorator: InjectDecorator | "Named",
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

// Checks that a constructor or method parameter has only one injection decorator.
// For example, if both `@Inject` and `@Optional` are used, it becomes difficult to
// understand which one "wins", unless the user is aware of the decorator evaluation order.
//
// @internal
export function checkSingleDecorator(
  dependency: MethodDependency,
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
): void {
  assert(dependency.appliedBy === undefined, () => {
    const location = getLocation(target, propertyKey, parameterIndex);
    return `multiple injection decorators on ${location}, but only one is allowed`;
  });
}

// Returns a human-readable description of the parameter location.
// For example: "Wizard constructor parameter 2" or "Wizard.set parameter 0"
//
// @internal
export function getLocation(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): string {
  const location =
    propertyKey === undefined
      ? `${(target as Constructor<any>).name} constructor`
      : `${(target.constructor as Constructor<any>).name}.${String(propertyKey)}`;
  return `${location} parameter ${parameterIndex}`;
}
