import { check } from "../errors";
import { getMetadata } from "../metadata";
import { Scope } from "../scope";
import type { Constructor } from "../token";

/**
 * Class decorator that sets the class scope to **Container** and enables
 * eager instantiation when the class is registered in the container.
 *
 * This causes the container to immediately create and cache the instance of the class,
 * instead of deferring instantiation until the first resolution.
 *
 * @example
 * ```ts
 * @EagerInstantiate()
 * class Wizard {}
 *
 * // Wizard is registered with Container scope, and an instance
 * // is immediately created and cached by the container
 * container.register(Wizard);
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function EagerInstantiate(): ClassDecorator {
  return function (Class): void {
    const metadata = getMetadata(Class as any as Constructor<any>);
    const currentScope = metadata.scope;

    check(!currentScope || currentScope.value === Scope.Container, () => {
      const { value, appliedBy } = currentScope!;
      return (
        `class ${Class.name}: Scope.${value} was already set by @${appliedBy},\n  ` +
        `but @EagerInstantiate is trying to set a conflicting Scope.Container.\n  ` +
        `Only one decorator should set the class scope, or all must agree on the same value.`
      );
    });

    metadata.eagerInstantiate = true;
    metadata.scope = {
      value: Scope.Container,
      appliedBy: "EagerInstantiate",
    };
  };
}
