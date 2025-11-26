import { check, getTokenName } from "../errors";
import { getMetadata } from "../metadata";
import type { ClassDecorator } from "./decorators";

/**
 * Class decorator that sets the class scope to **Container** and enables
 * eager instantiation when the class is registered in the container.
 *
 * This causes the container to immediately create and cache the instance of the class,
 * instead of deferring instantiation until the first resolution.
 *
 * Example:
 * ```ts
 * @EagerInstantiate()
 * class Wizard {}
 *
 * // Wizard is registered with Container scope, and an instance
 * // is immediately created and cached by the container
 * container.register(Wizard);
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function EagerInstantiate<This extends object>(): ClassDecorator<This> {
  return function (Class): void {
    const metadata = getMetadata(Class);
    const currentScope = metadata.scope;
    check(!currentScope || currentScope.value === "Container", () => {
      const { value, appliedBy } = currentScope!;
      const className = getTokenName(Class);
      return (
        `class ${className}: scope ${value} was already set by @${appliedBy},\n  ` +
        `but @EagerInstantiate is trying to set a conflicting scope Container.\n  ` +
        `Only one decorator should set the class scope, or all must agree on the same value.`
      );
    });

    metadata.eagerInstantiate = true;
    metadata.scope = {
      value: "Container",
      appliedBy: "EagerInstantiate",
    };
  };
}
