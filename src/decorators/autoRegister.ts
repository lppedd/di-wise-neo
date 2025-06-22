import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import type { ClassDecorator } from "./decorators";

/**
 * Decorator for enabling auto-registration of a class.
 *
 * @example
 * ```ts
 * @AutoRegister()
 * class Wizard {}
 *
 * const wizard = container.resolve(Wizard);
 * container.isRegistered(Wizard); // => true
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function AutoRegister<This extends object>(
  enable = true,
): ClassDecorator<Constructor<This>> {
  return (Class) => {
    const metadata = getMetadata(Class);
    metadata.autoRegister = enable;
  };
}
