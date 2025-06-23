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
export function Injectable<This extends object, Value extends This>(
  token: Token<Value>,
  ...tokens: Token<Value>[]
): ClassDecorator<Constructor<This>> {
  return (Class) => {
    const metadata = getMetadata(Class);
    metadata.tokens.add(token);

    for (const other of tokens) {
      metadata.tokens.add(other);
    }
  };
}
