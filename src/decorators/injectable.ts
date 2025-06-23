import { getMetadata } from "../metadata";
import type { Constructor, Token } from "../token";
import type { ClassDecorator } from "./decorators";
import { throwNoTokensProvidedError } from "../errors";

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
  ...tokens: Token<Value>[]
): ClassDecorator<Constructor<This>> {
  // The current method signature allows for an empty array.
  // While that is not solved, let's throw an error when no tokens are provided.
  if (tokens.length === 0) {
    throwNoTokensProvidedError();
  }

  return (Class) => {
    const metadata = getMetadata(Class);

    for (const token of tokens) {
      metadata.tokens.add(token);
    }
  };
}
