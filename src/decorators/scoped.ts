import { check, getTokenName } from "../errors";
import { getMetadata } from "../metadata";
import type { Scope } from "../scope";
import type { Constructor } from "../token";

/**
 * Class decorator for setting the scope of the decorated type when registering it.
 *
 * The scope set by this decorator can be overridden by explicit registration options, if provided.
 *
 * @example
 * ```ts
 * @Scoped("Container")
 * class Wizard {}
 *
 * container.register(Wizard);
 *
 * // Under the hood
 * container.register(
 *   Wizard,
 *   { useClass: Wizard },
 *   { scope: "Container" },
 * );
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Scoped(scope: Scope): ClassDecorator {
  return function (Class): void {
    const ctor = Class as any as Constructor<object>;
    const metadata = getMetadata(ctor);
    const currentScope = metadata.scope;
    check(!currentScope || currentScope.value === scope, () => {
      const { value, appliedBy } = currentScope!;
      const by = appliedBy === "Scoped" ? `another @${appliedBy} decorator` : `@${appliedBy}`;
      const className = getTokenName(ctor);
      return (
        `class ${className}: scope ${value} was already set by ${by},\n  ` +
        `but @Scoped is trying to set a conflicting scope ${scope}.\n  ` +
        `Only one decorator should set the class scope, or all must agree on the same value.`
      );
    });

    metadata.scope = {
      value: scope,
      appliedBy: "Scoped",
    };
  };
}
