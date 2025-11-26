import { getMetadata } from "../metadata";
import type { ClassDecorator } from "./decorators";

/**
 * Class decorator that enables auto-registration of an unregistered class
 * when the class is first resolved from the container.
 *
 * Example:
 * ```ts
 * @AutoRegister()
 * class Wizard {}
 *
 * const wizard = container.resolve(Wizard);
 * container.isRegistered(Wizard); // => true
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function AutoRegister<This extends object>(): ClassDecorator<This> {
  return function (Class): void {
    const metadata = getMetadata(Class);
    metadata.autoRegister = true;
  };
}
