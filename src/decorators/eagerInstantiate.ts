import { getMetadata } from "../metadata";
import type { Constructor } from "../token";

/**
 * Class decorator that enables eager instantiation of a class when it is registered
 * in the container with `Scope.Container`.
 *
 * This causes the container to immediately create and cache the instance of the class,
 * instead of deferring instantiation until the first resolution.
 *
 * @example
 * ```ts
 * @EagerInstantiate
 * @Scoped(Scope.Container)
 * class Wizard {}
 *
 * // A Wizard instance is immediately created and cached by the container
 * const wizard = container.register(Wizard);
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function EagerInstantiate<Ctor extends Constructor<any>>(Class: Ctor): void {
  const metadata = getMetadata(Class);
  metadata.eagerInstantiate = true;
}
