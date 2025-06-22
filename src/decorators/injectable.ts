import { getMetadata } from "../metadata";
import type { Constructor, Token } from "../token";
import type { ClassDecorator } from "./decorators";

/**
 * Decorator for adding additional tokens to a class when registering.
 *
 * @example
 * ```ts
 * @Injectable(Weapon)
 * class Wand {}
 *
 * container.register(Wand);
 *
 * // Under the hood
 * [Wand, Weapon].forEach((token) => {
 *   container.register(
 *     token,
 *     {useClass: Wand},
 *   );
 * });
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Injectable<This extends object>(
  ...tokens: Token<This>[]
): ClassDecorator<Constructor<This>> {
  return (Class) => {
    const metadata = getMetadata(Class);

    for (const token of tokens) {
      metadata.tokens.add(token);
    }
  };
}
