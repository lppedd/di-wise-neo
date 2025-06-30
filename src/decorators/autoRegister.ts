import { getMetadata } from "../metadata";
import type { Constructor } from "../token";

/**
 * Class decorator that enables auto-registration of an unregistered class,
 * when the class is first resolved from the container.
 *
 * @example
 * ```ts
 * @AutoRegister
 * class Wizard {}
 *
 * const wizard = container.resolve(Wizard);
 * container.isRegistered(Wizard); // => true
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function AutoRegister<Ctor extends Constructor<any>>(Class: Ctor): void {
  const metadata = getMetadata(Class);
  metadata.autoRegister = true;
}
