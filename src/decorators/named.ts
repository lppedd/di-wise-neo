import { check, getLocation } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import { checkNamedDecorator, describeParam, updateParameterMetadata } from "./utils";

/**
 * Qualifies a class or an injected parameter with a unique name.
 *
 * This allows the container to distinguish between multiple implementations
 * of the same interface or type during registration and injection.
 *
 * @example
 * ```ts
 * @Named("dumbledore")
 * class Dumbledore implements Wizard {}
 *
 * // Register Dumbledore with Type<Wizard>
 * container.register(IWizard, { useClass: Dumbledore });
 * const dumbledore = container.resolve(IWizard, "dumbledore");
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Named(name: string): ClassDecorator & ParameterDecorator {
  check(name.trim(), "the @Named qualifier cannot be empty or blank");
  return function (target: object, propertyKey?: string | symbol, parameterIndex?: number): void {
    if (parameterIndex === undefined) {
      // The decorator has been applied to the class
      const ctor = target as any as Constructor<any>;
      const location = getLocation(ctor);
      const metadata = getMetadata(ctor);
      check(metadata.name === undefined, `multiple @Named decorators on class ${location}, but only one is allowed`);
      metadata.name = name;
    } else {
      // The decorator has been applied to a method parameter
      updateParameterMetadata("Named", target, propertyKey, parameterIndex, (dependency) => {
        check(dependency.name === undefined, () => {
          const param = describeParam(target, propertyKey, parameterIndex);
          return `multiple @Named decorators on ${param}, but only one is allowed`;
        });

        dependency.name = name;
        checkNamedDecorator(dependency, target, propertyKey, parameterIndex);
      });
    }
  };
}
