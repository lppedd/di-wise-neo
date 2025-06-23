import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Tokens } from "../token";
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
  ...tokens: Tokens<Value>
): ClassDecorator<Constructor<This>> {
  return (Class) => {
    const metadataTokens = getMetadata(Class).tokens;

    for (const token of tokens) {
      const message = `token ${token.name} must be passed exactly once to @Injectable`;
      assert(!metadataTokens.has(token), message);
      metadataTokens.add(token);
    }
  };
}
