import { assert } from "../errors";
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
    const metadataTokens = getMetadata(Class).tokens;
    metadataTokens.add(token);

    for (const other of tokens) {
      const message = `token ${other.name} must be passed exactly once to @Injectable`;
      assert(!metadataTokens.has(other), message);
      metadataTokens.add(other);
    }
  };
}
