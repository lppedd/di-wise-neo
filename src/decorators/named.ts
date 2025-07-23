import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import { updateParameterMetadata } from "./decorators";

/**
 * Qualifies a class or an injected parameter by a unique name.
 *
 * @example
 * ```ts
 * @Named('Dumbledore')
 * class Dumbledore extends Wizard {}
 *
 * container.register(Wizard, { useClass: Dumbledore });
 * container.resolve(Wizard, "Dumbledore");
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Named(name: string): ClassDecorator & ParameterDecorator {
  if (!name) {
    assert(false, "The @Named qualifier cannot be empty");
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
