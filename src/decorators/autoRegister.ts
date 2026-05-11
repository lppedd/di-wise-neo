import { getMetadata } from "../metadata";
import type { Constructor } from "../token";
import type { ClassDecorator } from "./decorators";

/**
 * Class decorator that enables auto-registration of an unregistered class
 * when the class is first resolved from the container.
 *
 * Example:
 * ```ts
 * @AutoRegister
 * class Wizard {}
 *
 * const wizard = container.resolve(Wizard);
 * container.isRegistered(Wizard); // => true
 * ```
 */
export function AutoRegister<This extends object, Ctor extends Constructor<This>>(target: Ctor): void;

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
 *
 * @deprecated Use `@AutoRegister` instead of `AutoRegister()`.
 */
export function AutoRegister<This extends object>(): ClassDecorator<This>;

// @__NO_SIDE_EFFECTS__
export function AutoRegister<This extends object, Ctor extends Constructor<This>>(
  target?: Ctor,
): ClassDecorator<This> | Ctor | void {
  const decorator: ClassDecorator<This> = (Class): void => {
    const metadata = getMetadata(Class);
    metadata.autoRegister = true;
  };

  return target === undefined ? decorator : decorator(target);
}
