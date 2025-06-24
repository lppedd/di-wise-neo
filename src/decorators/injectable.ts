import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Tokens } from "../token";

/**
 * Decorator for adding aliasing tokens to a class when registering it.
 *
 * The container uses {@link ExistingProvider} under the hood.
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
 *     { useClass: Wand },
 *   );
 * });
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Injectable<This extends object, Value extends This>(
  ...tokens: Tokens<Value>
): ClassDecorator {
  return (Class) => {
    const metadataTokens = getMetadata(Class as any as Constructor<any>).tokens;

    for (const token of tokens) {
      const message = `token ${token.name} must be passed exactly once to @Injectable`;
      assert(!metadataTokens.has(token), message);
      metadataTokens.add(token);
    }
  };
}
