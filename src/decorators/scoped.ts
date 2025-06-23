import { getMetadata } from "../metadata";
import type { Scope } from "../scope";
import type { Constructor } from "../token";
import type { ClassDecorator } from "./decorators";

/**
 * Decorator for setting the scope of a class when registering it.
 *
 * The scope specified by this decorator is overridden by explicit
 * registration options, if provided.
 *
 * @example
 * ```ts
 * @Scoped(Scope.Container)
 * class Wizard {}
 *
 * container.register(Wizard);
 *
 * // Under the hood
 * container.register(
 *   Wizard,
 *   { useClass: Wizard },
 *   { scope: Scope.Container },
 * );
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Scoped<This extends object>(scope: Scope): ClassDecorator<Constructor<This>> {
  return (Class) => {
    const metadata = getMetadata(Class);
    metadata.scope = scope;
  };
}
