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
export function Scoped(scope: Scope): ClassDecorator {
  return function (Class): void {
    const metadata = getMetadata(Class as any as Constructor<any>);
    metadata.scope = scope;
  };
}
