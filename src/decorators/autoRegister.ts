import { getMetadata } from "../metadata";
import type { Constructor } from "../token";

/**
 * Decorator for enabling auto-registration of a class when resolving it.
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
