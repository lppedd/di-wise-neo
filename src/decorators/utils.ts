import { check } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import type { MethodDependency } from "../tokenRegistry";

// @internal
export function updateParameterMetadata(
  decorator: string,
  target: object,
  methodKey: string | symbol | undefined,
  parameterIndex: number,
  updateFn: (dependency: MethodDependency) => void,
): void {
  // Error out immediately if the decorator has been applied to a static method
  if (methodKey !== undefined && typeof target === "function") {
    check(false, `@${decorator} cannot be used on static method ${target.name}.${String(methodKey)}`);
  }

  if (methodKey === undefined) {
    // Constructor
    const metadata = getMetadata(target as Constructor<object>);
    const dependency = metadata.getCtorDependency(parameterIndex);
    updateFn(dependency);
  } else {
    // Instance method
    const metadata = getMetadata(target.constructor as Constructor<object>);
    const dependency = metadata.getMethodDependency(methodKey, parameterIndex);
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
  methodKey: string | symbol | undefined,
  parameterIndex: number,
): void {
  check(dependency.appliedBy === undefined, () => {
    const param = describeParam(target, methodKey, parameterIndex);
    return `multiple injection decorators on ${param}, but only one is allowed`;
  });
}

// Checks that the `@Named` decorator is not used in combination with
// `@InjectAll` or `@OptionalAll`, which ignore the name qualification.
//
// @internal
export function checkNamedDecorator(
  dependency: MethodDependency,
  target: object,
  methodKey: string | symbol | undefined,
  parameterIndex: number,
): void {
  const { appliedBy, name } = dependency;
  check(name === undefined || (appliedBy !== "InjectAll" && appliedBy !== "OptionalAll"), () => {
    const param = describeParam(target, methodKey, parameterIndex);
    return `@Named has no effect on ${param} when used with @${appliedBy}`;
  });
}

// Returns a human-readable description of the parameter location.
// For example: "Wizard constructor parameter 2" or "Wizard.set parameter 0"
//
// @internal
export function describeParam(target: object, methodKey: string | symbol | undefined, parameterIndex: number): string {
  const location =
    methodKey === undefined //
      ? (target as Constructor<object>).name
      : `${target.constructor.name}.${String(methodKey)}`;
  return `${location}(parameter #${parameterIndex})`;
}
