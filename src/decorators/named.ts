import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import { updateParameterMetadata } from "./utils";

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
  if (!name.trim()) {
    assert(false, "the @Named qualifier cannot be empty or blank");
  }

  return function (target: object, propertyKey?: string | symbol, parameterIndex?: number): void {
    if (parameterIndex === undefined) {
      // The decorator has been applied to the class
      const ctor = target as any as Constructor<any>;
      const metadata = getMetadata(ctor);
      assert(!metadata.name, `a @Named('${metadata.name}') qualifier has already been applied to ${ctor.name}`);
      metadata.name = name;
    } else {
      // The decorator has been applied to a method parameter
      updateParameterMetadata("Named", target, propertyKey, parameterIndex, (dependency) => {
        assert(!dependency.name, `a @Named('${dependency.name}') qualifier has already been applied to the parameter`);
        dependency.name = name;
      });
    }
  };
}
