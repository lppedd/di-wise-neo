import { getMetadata } from "../metadata";
import type { Constructor } from "../token";

/**
 * Class decorator for enabling auto-registration of an unregistered class
 * when first resolving it from the container.
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
export function AutoRegister(enable: boolean = true): ClassDecorator {
  return function (Class) {
    const metadata = getMetadata(Class as any as Constructor<any>);
    metadata.autoRegister = enable;
  };
}
